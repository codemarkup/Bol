"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getInitials, getColor, formatTime } from "@/lib/supabase/chat";

/**
 * AppPreloader — runs invisibly on mount, pre-warms every localStorage cache.
 * Contacts → contacts page, chat modal
 * Conversations → chat list
 * Messages → last 50 msgs for the most recent 5 conversations
 * This component renders nothing; it's purely a side-effect runner.
 */
export function AppPreloader() {
  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const uid = user.id;
      localStorage.setItem("bol_last_user_id", uid);

      // ── 1. Contacts ────────────────────────────────────────────
      const { data: contactRows } = await supabase
        .from("contacts")
        .select("contact_id")
        .eq("owner_id", uid)
        .eq("status", "accepted");

      let contactIds: string[] = [];
      if (contactRows && contactRows.length > 0) {
        contactIds = contactRows.map((r: any) => r.contact_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, updated_at")
          .in("id", contactIds)
          .order("full_name", { ascending: true });

        const { data: unames } = await supabase
          .from("usernames")
          .select("id, username")
          .in("id", contactIds);

        const joined = (profiles || []).map((p: any) => {
          const un = unames?.find((u: any) => u.id === p.id);
          return { ...p, username: un?.username ?? null };
        });

        // Used by contacts page
        localStorage.setItem(`bol_contacts_page_cache_${uid}`, JSON.stringify(joined));
        // Used by chat modal (simpler shape)
        const simple = (profiles || []).map((p: any) => ({ id: p.id, full_name: p.full_name }));
        localStorage.setItem(`bol_contacts_cache_${uid}`, JSON.stringify(simple));
      } else {
        // Fallback: all users
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .neq("id", uid)
          .limit(30);
        localStorage.setItem(`bol_contacts_cache_${uid}`, JSON.stringify(allProfiles || []));
        localStorage.setItem(`bol_contacts_page_cache_${uid}`, JSON.stringify(allProfiles || []));
      }

      // ── 2. Conversations ───────────────────────────────────────
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at, role")
        .eq("user_id", uid);

      if (!memberships?.length) return;
      const convIds = memberships.map((m: any) => m.conversation_id);

      const { data: convs } = await supabase
        .from("conversations")
        .select("id, type, name, updated_at, member_count, is_announcement_only")
        .in("id", convIds)
        .order("updated_at", { ascending: false });

      if (!convs?.length) return;

      const { data: otherMembers } = await supabase
        .from("conversation_members")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds)
        .neq("user_id", uid);

      const otherUserIds = Array.from(new Set((otherMembers || []).map((m: any) => m.user_id)));
      const { data: otherProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", otherUserIds);

      const profileMap: Record<string, string> = {};
      (otherProfiles || []).forEach((p: any) => { profileMap[p.id] = p.full_name; });

      const { data: muted } = await supabase
        .from("muted_members")
        .select("conversation_id, muted_until")
        .eq("user_id", uid);
      const mutedMap: Record<string, string> = {};
      (muted || []).forEach((m: any) => {
        if (!m.muted_until || new Date(m.muted_until) > new Date()) {
          mutedMap[m.conversation_id] = m.muted_until || "forever";
        }
      });

      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("conversation_id, content, type, created_at, sender_id")
        .in("conversation_id", convIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const membershipMap: Record<string, any> = {};
      memberships.forEach((m: any) => { membershipMap[m.conversation_id] = m; });

      const lastMsgMap: Record<string, any> = {};
      (lastMsgs || []).forEach((msg: any) => {
        if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = msg;
      });

      const otherMemberMap: Record<string, any[]> = {};
      (otherMembers || []).forEach((m: any) => {
        if (!otherMemberMap[m.conversation_id]) otherMemberMap[m.conversation_id] = [];
        otherMemberMap[m.conversation_id].push(m);
      });

      const unreadMap: Record<string, number> = {};
      (lastMsgs || []).forEach((msg: any) => {
        const lastRead = membershipMap[msg.conversation_id]?.last_read_at;
        if (msg.sender_id !== uid && lastRead && new Date(msg.created_at) > new Date(lastRead)) {
          unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1;
        }
      });

      const formatted = convs.map((conv: any) => {
        const lastMsg = lastMsgMap[conv.id];
        const others = otherMemberMap[conv.id] || [];
        const isGroup = conv.type === "group";
        const name = !isGroup
          ? (profileMap[others[0]?.user_id] || "Unknown")
          : (conv.name || "Group");

        let messagePreview = "Start chatting!";
        if (lastMsg) {
          if (lastMsg.type === "text" || lastMsg.type === "system") {
            if (isGroup) {
              const senderName = profileMap[lastMsg.sender_id] || "Someone";
              messagePreview = lastMsg.type === "system" ? lastMsg.content : `${senderName}: ${lastMsg.content}`;
            } else {
              messagePreview = lastMsg.content;
            }
          } else {
            messagePreview = `📎 ${lastMsg.type}`;
          }
        }

        return {
          id: conv.id,
          name,
          initials: getInitials(name),
          color: isGroup ? "bg-[#8B5CF6] text-white" : getColor(name),
          message: messagePreview,
          time: lastMsg ? formatTime(lastMsg.created_at) : "",
          unread: unreadMap[conv.id] || 0,
          online: false,
          isGroup,
          memberCount: isGroup ? (conv.member_count || others.length + 1) : undefined,
          otherUserId: !isGroup ? others[0]?.user_id : undefined,
          isAnnouncementOnly: conv.is_announcement_only,
          myRole: membershipMap[conv.id]?.role,
          mutedUntil: mutedMap[conv.id],
        };
      });

      localStorage.setItem(`bol_conversations_cache_${uid}`, JSON.stringify(formatted));

      // ── 3. Messages for top 5 conversations ───────────────────
      const topConvIds = convs.slice(0, 5).map((c: any) => c.id);
      for (const cid of topConvIds) {
        const cached = localStorage.getItem(`bol_messages_cache_${cid}`);
        // Only re-fetch if not cached or conversation had a new message since last cache
        const lastMsg = lastMsgMap[cid];
        const cacheEntry = cached ? JSON.parse(cached) : null;
        const cacheIsStale = !cacheEntry || !lastMsg || 
          cacheEntry[cacheEntry.length - 1]?.rawTime !== lastMsg.created_at;
        
        if (!cacheIsStale) continue;

        const { data: msgsData } = await supabase
          .from("messages")
          .select("id, sender_id, content, type, created_at, reply_to_id, reply_to_content, reply_to_sender, message_reactions(emoji, user_id)")
          .eq("conversation_id", cid)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!msgsData) continue;
        const msgs = [...msgsData].reverse();

        const senderIds = Array.from(new Set(msgs.map((m: any) => m.sender_id)));
        const { data: msgProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);

        const msgProfileMap: Record<string, string> = {};
        (msgProfiles || []).forEach((p: any) => { msgProfileMap[p.id] = p.full_name; });

        const formatted = msgs.map((m: any) => ({
          id: m.id,
          sender_id: m.sender_id,
          content: m.content || "",
          type: m.type || "text",
          time: formatTime(m.created_at),
          rawTime: m.created_at,
          isSent: m.sender_id === uid,
          senderName: msgProfileMap[m.sender_id] || "Unknown",
          reactions: [],
          read: true,
          replyTo: m.reply_to_content ? { id: m.reply_to_id || "", content: m.reply_to_content, senderName: m.reply_to_sender || "Unknown" } : null,
        }));

        localStorage.setItem(`bol_messages_cache_${cid}`, JSON.stringify(formatted));
      }
    };

    run();
  }, []);

  return null;
}
