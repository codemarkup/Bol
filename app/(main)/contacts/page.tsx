"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ContactsList } from "@/components/contacts/ContactsList";
import { ContactProfile } from "@/components/contacts/ContactProfile";
import { ContextMenu } from "@/components/chat/ContextMenu";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/hooks/usePresence";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, UserPlus, Check } from "lucide-react";

export default function ContactsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [contacts, setContacts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('bol_last_user_id');
      if (uid) {
        const cached = localStorage.getItem(`bol_contacts_page_cache_${uid}`);
        if (cached) {
          try { return JSON.parse(cached); } catch(e) {}
        }
      }
    }
    return [];
  });
  const [contactsLoaded, setContactsLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('bol_last_user_id');
      return !!uid && !!localStorage.getItem(`bol_contacts_page_cache_${uid}`);
    }
    return false;
  });
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Contact right-click context menu
  const [contactContextMenu, setContactContextMenu] = useState<{
    contactId: string;
    x: number;
    y: number;
  } | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const { onlineUsers } = usePresence(currentUser?.id ?? null);

  // ─── Load contacts from the contacts table ───────────────────
  const loadContacts = useCallback(async (userId: string) => {
    // Fetch contact rows owned by the current user
    const { data: rows, error } = await supabase
      .from('contacts')
      .select('contact_id, status, created_at')
      .eq('owner_id', userId)
      .eq('status', 'accepted');

    if (error) { console.error('loadContacts error:', error); return; }
    if (!rows || rows.length === 0) { setContacts([]); return; }

    const ids = rows.map((r: any) => r.contact_id);

    // Fetch profiles for those IDs
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, updated_at')
      .in('id', ids)
      .order('full_name', { ascending: true });

    // Fetch usernames for those IDs
    const { data: unames } = await supabase
      .from('usernames')
      .select('id, username')
      .in('id', ids);

    if (profiles) {
      const joined = profiles.map((p: any) => {
        const un = unames?.find((u: any) => u.id === p.id);
        return { ...p, username: un?.username ?? null };
      });
      setContacts(joined);
      setContactsLoaded(true);
      localStorage.setItem(`bol_contacts_page_cache_${userId}`, JSON.stringify(joined));
    } else {
      setContactsLoaded(true);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      localStorage.setItem('bol_last_user_id', user.id);
      await loadContacts(user.id);
    }
    init();
  }, [supabase, loadContacts]);

  // ─── Add Contact search ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    async function search() {
      const cleanQuery = searchQuery.trim().replace(/^@/, '');
      if (!cleanQuery) { setSearchResults([]); return; }

      const { data: matchedUsernames, error } = await supabase
        .from('usernames')
        .select('username, id')
        .ilike('username', `%${cleanQuery}%`)
        .limit(10);

      if (error || !matchedUsernames?.length) { setSearchResults([]); return; }

      const ids = matchedUsernames.map((u: any) => u.id).filter((id: string) => id !== currentUser?.id);
      if (!ids.length) { setSearchResults([]); return; }

      const { data: matchedProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids);

      // Check which ones are already contacts
      const contactIds = new Set(contacts.map(c => c.id));

      const results = matchedUsernames
        .filter((u: any) => u.id !== currentUser?.id)
        .map((u: any) => {
          const profile = matchedProfiles?.find((p: any) => p.id === u.id);
          return {
            id: u.id,
            username: u.username,
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            isContact: contactIds.has(u.id),
          };
        });
      setSearchResults(results);
    }
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase, currentUser, contacts]);

  const handleAddContact = async (userId: string) => {
    if (!currentUser || addingId) return;
    setAddingId(userId);

    const { error } = await supabase.from('contacts').upsert({
      owner_id: currentUser.id,
      contact_id: userId,
      status: 'accepted',
    }, { onConflict: 'owner_id,contact_id' });

    if (!error) {
      // Mark as contact in search results instantly
      setSearchResults(prev =>
        prev.map(r => r.id === userId ? { ...r, isContact: true } : r)
      );
      await loadContacts(currentUser.id);
    }
    setAddingId(null);
  };

  // ─── Message helper ───────────────────────────────────────────
  const handleMessage = useCallback(async (otherUserId: string) => {
    if (!currentUser) return;
    const { data: myMemberships } = await supabase
      .from('conversation_members').select('conversation_id').eq('user_id', currentUser.id);
    const myConvIds = myMemberships?.map((m: any) => m.conversation_id) || [];

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds);

      const existing = shared?.find((c: any) => c.conversations?.type === 'direct');
      if (existing) { router.push(`/chat?id=${existing.conversation_id}`); return; }
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: currentUser.id })
      .select().single();

    if (conv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: currentUser.id, role: 'admin' },
        { conversation_id: conv.id, user_id: otherUserId, role: 'member' },
      ]);
      router.push(`/chat?id=${conv.id}`);
    }
  }, [currentUser, supabase, router]);

  // ─── Context menu action handler ─────────────────────────────
  const handleContactContextAction = useCallback(async (action: string) => {
    if (!contactContextMenu) return;
    const { contactId } = contactContextMenu;
    setContactContextMenu(null);

    if (action === 'chat') {
      await handleMessage(contactId);
    } else if (action === 'call') {
      alert('Audio calling coming soon!');
    } else if (action === 'video_call') {
      alert('Video calling coming soon!');
    } else if (action === 'block_contact') {
      if (!currentUser) return;
      await supabase
        .from('contacts')
        .update({ status: 'blocked' })
        .eq('owner_id', currentUser.id)
        .eq('contact_id', contactId);
      await loadContacts(currentUser.id);
      if (activeContactId === contactId) { setActiveContactId(null); setShowMainOnMobile(false); }
    } else if (action === 'delete_contact') {
      if (!currentUser) return;
      await supabase
        .from('contacts')
        .delete()
        .eq('owner_id', currentUser.id)
        .eq('contact_id', contactId);

      // Instant UI update
      setContacts(prev => prev.filter(c => c.id !== contactId));
      if (activeContactId === contactId) { setActiveContactId(null); setShowMainOnMobile(false); }
    }
  }, [contactContextMenu, handleMessage, currentUser, supabase, activeContactId, loadContacts]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contactContextMenu) return;
    const handler = () => setContactContextMenu(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contactContextMenu]);

  const activeContact = contacts.find(c => c.id === activeContactId);

  const sidebar = (
    <ContactsList
      activeId={activeContactId}
      onSelect={(id: string) => { setActiveContactId(id); setShowMainOnMobile(true); }}
      contacts={contacts}
      isLoaded={contactsLoaded}
      onlineUsers={onlineUsers}
      onOpenAddContact={() => { setSearchQuery(''); setSearchResults([]); setIsAddModalOpen(true); }}
      onContactContextMenu={(id: string, x: number, y: number) =>
        setContactContextMenu({ contactId: id, x, y })
      }
    />
  );

  const main = (
    <ContactProfile
      contact={activeContact}
      isOnline={activeContactId ? onlineUsers.has(activeContactId) : false}
      onBack={() => setShowMainOnMobile(false)}
      onMessage={() => activeContactId && handleMessage(activeContactId)}
      currentUser={currentUser}
    />
  );

  return (
    <>
      <ResponsiveLayout
        sidebarContent={sidebar}
        mainContent={main}
        showMainOnMobile={showMainOnMobile}
        onBackToSidebar={() => setShowMainOnMobile(false)}
      />

      {/* Contact right-click context menu */}
      <AnimatePresence>
        {contactContextMenu && (
          <ContextMenu
            contextMenu={{ type: 'contact', x: contactContextMenu.x, y: contactContextMenu.y }}
            onClose={() => setContactContextMenu(null)}
            onAction={handleContactContextAction}
          />
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-[#ECECEC] flex items-center justify-between">
                <h3 className="text-lg font-bold">Add Contact</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F6F8F7] text-[#6B7280]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-[#ECECEC]">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F6F8F7] border border-transparent focus:border-brand focus:bg-white rounded-xl pl-10 pr-4 py-3 text-[14px] outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                {searchResults.length > 0 ? searchResults.map(user => (
                  <div key={user.id} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F6F8F7] transition-colors">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.full_name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[14px] truncate">{user.full_name || 'Unknown User'}</div>
                      <div className="text-[12px] text-[#6B7280]">@{user.username}</div>
                    </div>
                    {user.isContact ? (
                      <div className="flex items-center gap-1.5 text-brand text-[13px] font-semibold shrink-0">
                        <Check className="w-4 h-4" /> Added
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddContact(user.id)}
                        disabled={addingId === user.id}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {addingId === user.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><UserPlus className="w-4 h-4" /> Add</>
                        )}
                      </button>
                    )}
                  </div>
                )) : searchQuery ? (
                  <div className="p-4 text-center text-[#9CA3AF] text-sm">No users found</div>
                ) : (
                  <div className="p-4 text-center text-[#9CA3AF] text-sm">Type a username to search</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
