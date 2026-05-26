"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatList } from "@/components/chat/ChatList";
import { MainChat } from "@/components/chat/MainChat";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContextMenu } from "@/components/chat/ContextMenu";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { createClient } from "@/lib/supabase/client";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";

export default function ChatPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ type: 'message' | 'chat' | 'background', x: number, y: number, message?: any, chat?: any } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);

  // Read ?id from URL if present to open a chat immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setActiveChatId(id);
        setShowMainOnMobile(true);
        
        // Remove the id from URL so it doesn't stay there forever
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, []);

  // Load current user
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setCurrentProfile(profile);
    }
    loadUser();
  }, [supabase]);

  const { conversations, isLoaded, refresh, updateOnlineStatus, markAsRead } = useConversations(currentUser?.id ?? null);
  const { messages, sendMessage, sendTyping, otherUserTyping, toggleReaction } = useMessages(activeChatId, currentUser?.id ?? null);
  const { onlineUsers } = usePresence(currentUser?.id ?? null);

  // Sync online status into conversations list
  useEffect(() => { updateOnlineStatus(onlineUsers); }, [onlineUsers, updateOnlineStatus]);

  // Optimistically clear unread count for active chat
  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId, markAsRead, messages]);

  const activeConversation = conversations.find(c => c.id === activeChatId);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setShowMainOnMobile(true);
  };

  const handleCloseChat = () => {
    setActiveChatId(null);
    setShowMainOnMobile(false);
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'message' | 'chat' | 'background', item?: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'message') {
      setContextMenu({ type, x: e.clientX, y: e.clientY, message: item });
    } else if (type === 'chat') {
      setContextMenu({ type, x: e.clientX, y: e.clientY, chat: item });
    } else {
      setContextMenu({ type, x: e.clientX, y: e.clientY });
    }
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!currentUser) return;

    // Check if direct conversation already exists
    const { data: myMemberships } = await supabase
      .from('conversation_members').select('conversation_id').eq('user_id', currentUser.id);
    const myConvIds = myMemberships?.map(m => m.conversation_id) || [];

    if (myConvIds.length > 0) {
      const { data: shared, error: sharedError } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds);

      if (sharedError) console.error("Error checking shared chats:", sharedError);

      const existing = shared?.find((c: any) => c.conversations?.type === 'direct');
      if (existing) {
        setIsNewChatModalOpen(false);
        handleSelectChat(existing.conversation_id);
        return;
      }
    }

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: currentUser.id })
      .select()
      .single();
      
    if (convError || !conv) {
      console.error("Error creating conversation:", convError);
      alert("Failed to create chat. Please check console.");
      return;
    }

    const { error: membersError } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: currentUser.id, role: 'admin' },
      { conversation_id: conv.id, user_id: otherUserId, role: 'member' },
    ]);
    
    if (membersError) {
      console.error("Error adding members:", membersError);
    }

    await refresh();
    setIsNewChatModalOpen(false);
    handleSelectChat(conv.id);
  };

  const handleLeaveGroup = async () => {
    if (!currentUser || !activeChatId) return;
    await supabase.from('conversation_members').delete().eq('conversation_id', activeChatId).eq('user_id', currentUser.id);
    handleCloseChat();
    refresh();
  };

  const handleDeleteGroup = async () => {
    if (!currentUser || !activeChatId) return;
    if (!window.confirm("This will permanently delete the group and all messages for everyone. Are you sure?")) return;
    const { error } = await supabase.from('conversations').delete().eq('id', activeChatId).eq('created_by', currentUser.id);
    if (error) console.error("Error deleting group:", error);
    handleCloseChat();
    refresh();
  };

  const sidebarContent = (
    <ChatList
      activeChatId={activeChatId}
      onSelectChat={handleSelectChat}
      conversations={conversations.map(c => c.id === activeChatId ? { ...c, unread: 0 } : c)}
      isLoaded={isLoaded}
      onContextMenu={(e, type, chat) => handleContextMenu(e, type, chat)}
      onOpenNewChat={() => setIsNewChatModalOpen(true)}
    />
  );

  const mainContent = (
    <AnimatePresence mode="wait">
      {activeChatId ? (
        <motion.div key="main-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }} className="w-full h-full absolute inset-0 bg-white">
          <MainChat
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUser?.id}
            currentDisplayName={currentProfile?.full_name || ''}
            onSendMessage={sendMessage}
            onTyping={sendTyping}
            otherUserTyping={otherUserTyping}
            onlineUsers={onlineUsers}
            onClose={handleCloseChat}
            onBack={() => setShowMainOnMobile(false)}
            onContextMenu={(e, type, message) => handleContextMenu(e, type, message)}
            onReact={toggleReaction}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </motion.div>
      ) : (
        <motion.div key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }} className="w-full h-full absolute inset-0 bg-white">
          <EmptyState />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full h-full" onClick={() => setContextMenu(null)}
      onContextMenu={(e) => handleContextMenu(e, 'background')}>
      <ResponsiveLayout sidebarContent={sidebarContent} mainContent={mainContent}
        showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu contextMenu={contextMenu} onClose={() => setContextMenu(null)}
            onAction={async (action, payload) => {
              if (action === 'close_chat') handleCloseChat();
              else if (action === 'reply' && contextMenu?.message) {
                setReplyTo({ id: contextMenu.message.id, content: contextMenu.message.content, senderName: contextMenu.message.senderName });
              }
              else if (action === 'react' && contextMenu?.message && payload) {
                toggleReaction(contextMenu.message.id, payload);
              }
              else if (action === 'pin_message' && contextMenu?.message) {
                supabase.from('pinned_messages').insert({
                  conversation_id: activeChatId,
                  message_id: contextMenu.message.id,
                  pinned_by: currentUser?.id
                }).then(({ error }) => { if (error) console.error(error); });
              }
              else if (action === 'delete_chat' && contextMenu?.chat && currentUser) {
                if (window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
                  // Delete conversation where user is creator (or leave if just member)
                  const chatToDelete = contextMenu.chat.id;
                  const { error } = await supabase.from('conversations').delete().eq('id', chatToDelete).eq('created_by', currentUser.id);
                  if (error) {
                     // Maybe it's a group or user isn't the creator. Try deleting the membership instead to "leave" the chat
                     await supabase.from('conversation_members').delete().eq('conversation_id', chatToDelete).eq('user_id', currentUser.id);
                  }
                  if (activeChatId === chatToDelete) {
                    handleCloseChat();
                  }
                  refresh();
                }
              }
              else alert(`Feature '${action}' coming soon!`);
            }} />
        )}
      </AnimatePresence>

      <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={handleStartChat} />
    </div>
  );
}
