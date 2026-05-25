"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ResponsiveLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  showMainOnMobile: boolean;
  onBackToSidebar: () => void;
}

export function ResponsiveLayout({ 
  sidebarContent, 
  mainContent, 
  showMainOnMobile, 
  onBackToSidebar 
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex w-full h-full relative overflow-hidden">
      {!isMobile && (
        <div className="flex w-full h-full">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="h-full flex shrink-0"
          >
            {sidebarContent}
          </motion.div>
          <div className="flex-1 h-full min-w-0 relative bg-white">
            {mainContent}
          </div>
        </div>
      )}

      {isMobile && (
        <AnimatePresence initial={false} mode="wait">
          {!showMainOnMobile ? (
            <motion.div
              key="list"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-30%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 w-full h-full bg-white z-10"
            >
              {sidebarContent}
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 w-full h-full bg-white z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]"
            >
              {/* Note: the mainContent is responsible for rendering its own back button that calls onBackToSidebar */}
              {mainContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
