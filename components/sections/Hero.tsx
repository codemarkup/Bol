"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MockupPhone } from "../ui/MockupPhone";
import { ChatContainer, ChatBubble, SystemMessage, AISummaryCard } from "../ui/ChatBubbles";
import { Sparkles, ArrowRight } from "lucide-react";

export function Hero() {
  const [isCaughtUp, setIsCaughtUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCaughtUp(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 [@media(min-height:800px)]:pt-32 [@media(min-height:800px)]:pb-20 overflow-hidden bg-background">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center z-10">
        
        {/* Left text column */}
        <div className="flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-soft-bg border border-border/60 text-muted mb-6">
              <span className="w-2 h-2 rounded-full bg-brand"></span>
              <span className="text-xs font-medium tracking-wide">Messaging finally evolved</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl [@media(min-height:800px)]:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-4 [@media(min-height:800px)]:mb-6">
              Stop settling for <br />
              <span className="text-muted/40">noise.</span>
            </h1>
            
            <p className="text-base md:text-lg [@media(min-height:800px)]:text-xl text-muted-foreground leading-relaxed max-w-md mb-6 [@media(min-height:800px)]:mb-10">
              AI summaries, voice transcription, threads, and privacy that actually makes sense. Built for modern communication.
            </p>

            <div className="flex items-center gap-4">
              <button className="bg-foreground text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10 flex items-center gap-2 group">
                Get Early Access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-full text-[15px] font-medium text-foreground hover:bg-soft-bg transition-colors">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Phone column */}
        <motion.div 
          className="relative flex justify-center lg:justify-end perspective-1000"
          initial={{ opacity: 0, scale: 0.95, rotateY: 10, rotateX: 5 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          {/* Floating decorative elements */}
          <motion.div 
            className="absolute -left-12 top-20 bg-white p-3 rounded-2xl shadow-xl border border-border/40 z-20 flex items-center gap-3"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Catch me up</span>
              <span className="text-[10px] text-muted-foreground">AI processed 287 messages</span>
            </div>
          </motion.div>

          <MockupPhone>
            {/* App Header */}
            <div className="flex items-center justify-between px-4 pb-2 border-b border-border/50 bg-white z-10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=33" alt="Group" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-none">Design Team</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">8 members</span>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden relative bg-surface/30">
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                
                <AnimatePresence mode="wait">
                  {!isCaughtUp ? (
                    <motion.div 
                      key="unread-state"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {/* Background mock messages (blurred) */}
                      <div className="absolute inset-0 flex flex-col justify-end gap-3 p-4 pb-8 opacity-40 blur-[3px] pointer-events-none">
                        <ChatBubble message="Did anyone take notes?" senderName="Sara" avatar="https://i.pravatar.cc/100?img=1" />
                        <ChatBubble isSender message="I think Ahmed did." />
                        <ChatBubble message="Can you send them over?" senderName="Ali" avatar="https://i.pravatar.cc/100?img=12" />
                        <ChatBubble message="Also need the figma link" senderName="Ali" />
                        <ChatBubble message="Sending in a bit" senderName="Ahmed" avatar="https://i.pravatar.cc/100?img=11" />
                      </div>

                      {/* The Catch Me Up Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center justify-center p-6 bg-white border border-border/80 shadow-2xl rounded-3xl w-[85%]">
                          <div className="w-14 h-14 rounded-full bg-soft-bg border border-border flex items-center justify-center shadow-sm mb-3">
                            <span className="text-xl font-bold text-foreground">287</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground mb-1">Unread Messages</span>
                          <span className="text-xs text-muted-foreground text-center mb-5">Since yesterday 10:42 PM</span>
                          
                          <button 
                            onClick={() => setIsCaughtUp(true)}
                            className="w-full flex items-center justify-center gap-2 bg-brand shadow-lg shadow-brand/20 px-6 py-3 rounded-full text-white font-semibold text-sm hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <Sparkles className="w-4 h-4 text-white fill-white/20" />
                            Catch me up
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="caught-up-state"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ staggerChildren: 0.1, duration: 0.5 }}
                      className="flex flex-col gap-3 justify-end h-full"
                    >
                      <SystemMessage text="Yesterday" />
                      
                      <ChatBubble 
                        message="Should we delay the launch to Thursday?"
                        senderName="Ahmed"
                        avatar="https://i.pravatar.cc/100?img=11"
                        time="10:42 PM"
                      />

                      <SystemMessage text="Today" />

                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <AISummaryCard points={[
                          "Launch meeting moved to 4PM",
                          "Ahmed shared the final figma files",
                          "Zara confirmed dinner reservations"
                        ]} />
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <ChatBubble 
                          isSender
                          message="Got it. I'll review the files now."
                          time="Just now"
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Input mock */}
            <div className="h-14 bg-white border-t border-border/50 shrink-0 flex items-center px-4 gap-3">
              <div className="w-6 h-6 rounded-full bg-soft-bg"></div>
              <div className="flex-1 h-8 rounded-full bg-soft-bg border border-border/50"></div>
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" style={{ clipPath: "polygon(0 0, 0 100%, 100% 50%)" }}></div>
              </div>
            </div>

          </MockupPhone>
        </motion.div>
      </div>
    </section>
  );
}
