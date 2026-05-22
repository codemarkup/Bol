"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { MockupPhone } from "../ui/MockupPhone";
import { ChatBubble, SystemMessage } from "../ui/ChatBubbles";
import { AlertCircle, Languages, Search } from "lucide-react";

const features = [
  {
    title: "Tone Checker",
    description: "Catch misunderstandings before you hit send.",
    ui: (
      <div className="flex flex-col h-full bg-surface/30 px-4 py-4 justify-end gap-3">
        <ChatBubble 
          message="Why wasn't this done yesterday?"
          isSender
        />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 shadow-sm rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700">Tone Check</span>
          </div>
          <p className="text-[11px] text-orange-800/80 mb-2">This message may sound aggressive.</p>
          <button className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-medium hover:bg-orange-200">
            Rewrite softer
          </button>
        </motion.div>
      </div>
    )
  },
  {
    title: "Inline Translation",
    description: "Seamless global conversations.",
    ui: (
      <div className="flex flex-col h-full bg-surface/30 px-4 py-4 justify-end gap-3">
        <div className="relative">
          <ChatBubble 
            message="¿A qué hora nos encontramos mañana?"
            senderName="Carlos"
            avatar="https://i.pravatar.cc/100?img=15"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-4 right-8 bg-white border border-border shadow-sm rounded-lg p-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Languages className="w-3 h-3 text-brand" />
              <span className="text-[9px] font-semibold text-brand uppercase tracking-wider">Translated</span>
            </div>
            <p className="text-[11px] font-medium text-foreground">What time are we meeting tomorrow?</p>
          </motion.div>
        </div>
      </div>
    )
  },
  {
    title: "Smart Search",
    description: "Find exactly what you need, instantly.",
    ui: (
      <div className="flex flex-col h-full bg-white px-4 py-6 gap-4">
        <div className="flex items-center gap-2 bg-soft-bg rounded-full px-3 py-2 border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-foreground font-medium">"wifi password from last month"</span>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/30 rounded-xl p-3 border border-border/50"
        >
          <span className="text-[10px] text-muted-foreground mb-1 block">Found in Apartment Group</span>
          <p className="text-sm font-medium">The wifi password is <span className="bg-brand/10 text-brand px-1 rounded">GuestNet2024!</span></p>
          <span className="text-[9px] text-muted-foreground mt-2 block">October 12</span>
        </motion.div>
      </div>
    )
  }
];

export function AIFeaturesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const index = Math.min(
      features.length - 1,
      Math.floor(latest * features.length)
    );
    setActiveIndex(index);
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-white">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-5xl w-full mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left: Phone UI */}
          <div className="flex justify-start">
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
                  {features[activeIndex].ui}
                </motion.div>
              </AnimatePresence>
            </MockupPhone>
          </div>

          {/* Right: Text */}
          <div className="relative h-[200px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col justify-center gap-4"
              >
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                  {features[activeIndex].title}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {features[activeIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
