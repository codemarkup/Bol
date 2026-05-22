"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { MockupPhone } from "../ui/MockupPhone";
import { ChatBubble, SystemMessage } from "../ui/ChatBubbles";
import { Check, CheckCheck, Clock } from "lucide-react";

const slides = [
  {
    title: "Some apps still think read receipts should be all or nothing.",
    ui: (
      <div className="flex flex-col h-full bg-white px-4 py-6 gap-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent z-10 pointer-events-none h-12" />
        <h3 className="font-semibold text-lg border-b pb-2">Privacy Settings</h3>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="font-medium">Read Receipts</span>
          <div className="w-10 h-6 bg-brand rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Exceptions</span>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Ahmed</span>
            <span className="text-xs text-brand font-medium">Off</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Work Group</span>
            <span className="text-xs text-brand font-medium">Off</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Some apps still don't let you schedule messages.",
    ui: (
      <div className="flex flex-col h-full bg-surface/30 px-4 py-4 justify-end gap-3">
        <SystemMessage text="Draft" />
        <div className="relative">
          <ChatBubble isSender message="Happy Birthday! Have a great day!" />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-3 -right-2 bg-white border border-border shadow-md rounded-full px-2 py-1 flex items-center gap-1 z-10"
          >
            <Clock className="w-3 h-3 text-brand" />
            <span className="text-[9px] font-semibold text-brand">Tomorrow 8:00 AM</span>
          </motion.div>
        </div>
      </div>
    )
  },
  {
    title: "Some group chats still feel impossible to follow.",
    ui: (
      <div className="flex flex-col h-full bg-surface/30 px-4 py-4 justify-end gap-3">
        <ChatBubble 
          message="What are we doing for dinner?"
          senderName="Zara"
          avatar="https://i.pravatar.cc/100?img=5"
        />
        <div className="ml-10 border-l-2 border-brand/20 pl-3 flex flex-col gap-2">
          <ChatBubble 
            isSender
            message="Let's do sushi."
          />
          <ChatBubble 
            message="I'm in! 🍣"
            senderName="Ahmed"
            avatar="https://i.pravatar.cc/100?img=11"
          />
        </div>
        <ChatBubble 
          message="Has anyone seen my keys?"
          senderName="Ali"
          avatar="https://i.pravatar.cc/100?img=12"
        />
      </div>
    )
  }
];

export function TheTrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const index = Math.min(
      slides.length - 1,
      Math.floor(latest * slides.length)
    );
    setActiveIndex(index);
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-soft-bg">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-5xl w-full mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text */}
          <div className="relative h-[200px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
              >
                {slides[activeIndex].title}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Right: Phone UI */}
          <div className="flex justify-end">
            <MockupPhone>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 mt-8 mb-8"
                >
                  {slides[activeIndex].ui}
                </motion.div>
              </AnimatePresence>
            </MockupPhone>
          </div>

        </div>
      </div>
    </section>
  );
}
