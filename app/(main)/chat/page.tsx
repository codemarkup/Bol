"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatList } from "@/components/chat/ChatList";
import { MainChat } from "@/components/chat/MainChat";
import { EmptyState } from "@/components/chat/EmptyState";
import { ContextMenu } from "@/components/chat/ContextMenu";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { mockChats } from "@/components/chat/mockData";
import { NewChatModal } from "@/components/chat/NewChatModal";

export default function ChatPage() {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ type: 'message' | 'chat' | 'background', x: number, y: number } | null>(null);

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setShowMainOnMobile(true);
  };

  const handleCloseChat = () => {
    setActiveChatId(null);
    setShowMainOnMobile(false);
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'message' | 'chat' | 'background') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, x: e.clientX, y: e.clientY });
  };

  const sidebarContent = (
    <ChatList 
      activeChatId={activeChatId} 
      onSelectChat={handleSelectChat}
      onContextMenu={(e, type) => handleContextMenu(e, type)}
      onOpenNewChat={() => setIsNewChatModalOpen(true)}
    />
  );

  const mainContent = (
    <AnimatePresence mode="wait">
      {activeChatId ? (
        <motion.div
          key="main-chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full h-full absolute inset-0 bg-white"
        >
          <MainChat 
            chat={mockChats.find(c => c.id === activeChatId)}
            onClose={handleCloseChat}
            onBack={() => setShowMainOnMobile(false)}
            onContextMenu={(e, type) => handleContextMenu(e, type)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full h-full absolute inset-0 bg-white"
        >
          <EmptyState />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div 
      className="w-full h-full"
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => handleContextMenu(e, 'background')}
    >
      <ResponsiveLayout 
        sidebarContent={sidebarContent}
        mainContent={mainContent}
        showMainOnMobile={showMainOnMobile}
        onBackToSidebar={() => setShowMainOnMobile(false)}
      />

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu 
            contextMenu={contextMenu} 
            onClose={() => setContextMenu(null)} 
            onAction={(action) => {
              if (action === 'close_chat') {
                handleCloseChat();
              } else {
                alert(`Feature '${action}' coming soon!`);
              }
            }}
          />
        )}
      </AnimatePresence>

      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
      />
    </div>
  );
}
