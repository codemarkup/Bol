"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatList } from "@/components/chat/ChatList";
import { MainChat } from "@/components/chat/MainChat";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { EmptyState } from "@/components/chat/EmptyState";
import { ContextMenu } from "@/components/chat/ContextMenu";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { Phone, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";
import { useCalls } from "@/hooks/useCalls";
import nextDynamic from 'next/dynamic';

const CallOverlays = nextDynamic(() => import('@/components/chat/CallOverlays').then(mod => mod.CallOverlays), { ssr: false });

export default function ChatPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ type: 'message' | 'chat' | 'background', x: number, y: number, message?: any, chat?: any } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [deleteModalMessage, setDeleteModalMessage] = useState<any>(null);

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
  const { incomingCall, activeCall, isCalling, callError, localAudioTrack, localVideoTrack, remoteUsers, startCall, acceptCall, rejectCall, endCall } = useCalls(currentUser?.id ?? null);

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

      if (sharedError) { /* ignore */ }

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
      return;
    }

    const { error: membersError } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: currentUser.id, role: 'admin' },
      { conversation_id: conv.id, user_id: otherUserId, role: 'member' },
    ]);
    
    if (membersError) {
      // Ignore silently
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
    if (error) { /* ignore */ }
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
            onStartCall={(type) => activeConversation && startCall(activeConversation.otherUserId!, activeConversation.id, type)}
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

  const warningMessages = useLiveQuery(() => {
    const cutoff = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString();
    return db.messages.where('created_at').below(cutoff).limit(1).toArray();
  }, [], []);

  let showWarning = false;
  let daysUntilDeletion = 0;
  if (warningMessages && warningMessages.length > 0) {
    const ageMs = Date.now() - new Date(warningMessages[0].created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays >= 75) {
      showWarning = true;
      daysUntilDeletion = Math.max(1, 90 - Math.floor(ageDays));
    }
  }

  return (
    <div className="w-full h-full flex flex-col relative" onClick={() => setContextMenu(null)}
      onContextMenu={(e) => handleContextMenu(e, 'background')}>
      {showWarning && (
        <div className="w-full bg-[#FFFBEB] text-[#B45309] px-4 py-2 text-sm font-medium flex items-center justify-center border-b border-[#FDE68A] z-50 shrink-0">
          ⚠️ Some messages are older than 75 days and will be automatically deleted from the cloud in {daysUntilDeletion} days. Enable local backups.
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveLayout sidebarContent={sidebarContent} mainContent={mainContent}
          showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />
      </div>

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
                }).then(({ error }) => { if (error) { /* ignore */ } });
              }
              else if (action === 'delete_chat' && contextMenu?.chat && currentUser) {
                if (window.confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
                  const chatToDelete = contextMenu.chat.id;
                  
                  // Try deleting the conversation entirely (only works if creator)
                  const { error, count } = await supabase
                    .from('conversations')
                    .delete({ count: 'exact' })
                    .eq('id', chatToDelete)
                    .eq('created_by', currentUser.id);
                    
                  // If it deleted 0 rows (we are not the creator or it's a group), leave the chat instead
                  if (error || count === 0) {
                     await supabase.from('conversation_members').delete().eq('conversation_id', chatToDelete).eq('user_id', currentUser.id);
                  }
                  
                  // IMPORTANT: Delete from local Dexie database so it instantly disappears from the UI
                  try {
                    const { db } = await import('@/lib/db');
                    await db.conversations.delete(chatToDelete);
                    await db.messages.where('conversation_id').equals(chatToDelete).delete();
                  } catch (e) {
                    console.error("Local DB delete error:", e);
                  }
                  
                  if (activeChatId === chatToDelete) {
                    handleCloseChat();
                  }
                  refresh();
                }
              }
              else if (action === 'transcribe_voice' && contextMenu?.message) {
                // Trigger the background transcription API
                fetch('/api/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    audioUrl: contextMenu.message.media_url, 
                    messageId: contextMenu.message.id 
                  })
                });
              }
              else if (action === 'delete_message' && contextMenu?.message) {
                setDeleteModalMessage(contextMenu.message);
              }
              else alert(`Feature '${action}' coming soon!`);
            }} />
        )}
      </AnimatePresence>

      <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={handleStartChat} />

      {/* Delete Message Modal */}
      <AnimatePresence>
        {deleteModalMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalMessage(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
              <h3 className="text-lg font-bold text-[#0F0F14] mb-2">Delete message?</h3>
              <div className="flex flex-col gap-3 mt-6">
                {deleteModalMessage.isSent && (
                  <button onClick={async () => {
                    await fetch('/api/messages/delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ messageId: deleteModalMessage.id, type: 'everyone', userId: currentUser.id })
                    });
                    setDeleteModalMessage(null);
                  }} className="w-full py-3 px-4 rounded-xl font-medium transition-colors bg-red-50 text-red-500 hover:bg-red-100">
                    Delete for everyone
                  </button>
                )}
                <button onClick={async () => {
                  await fetch('/api/messages/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId: deleteModalMessage.id, type: 'me', userId: currentUser.id })
                  });
                  setDeleteModalMessage(null);
                }} className="w-full py-3 px-4 rounded-xl font-medium transition-colors border border-[#ECECEC] text-[#0F0F14] hover:bg-gray-50">
                  Delete for me
                </button>
                <button onClick={() => setDeleteModalMessage(null)} className="w-full py-3 px-4 rounded-xl font-medium transition-colors text-[#6B7280] hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-End UI Call Overlays */}
      <CallOverlays
        incomingCall={incomingCall}
        activeCall={activeCall}
        isCalling={isCalling}
        localAudioTrack={localAudioTrack}
        localVideoTrack={localVideoTrack}
        remoteUsers={remoteUsers}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        endCall={endCall}
      />

    </div>
  );
}
