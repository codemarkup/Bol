"use client";

import { motion } from "framer-motion";
import { MockupPhone } from "../ui/MockupPhone";
import { ChatBubble } from "../ui/ChatBubbles";

export function FinalCTA() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-background">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative -mb-40 perspective-1000"
        >
          <div className="scale-75 md:scale-90 origin-bottom shadow-2xl rounded-[2.5rem]">
            <MockupPhone>
               <div className="flex flex-col h-full bg-surface/30 px-4 py-6 justify-end gap-3 pb-20">
                  <ChatBubble message="Is Bol ready for download?" avatar="https://i.pravatar.cc/100?img=11" />
                  <ChatBubble isSender message="Almost. Reserving my username now." />
               </div>
            </MockupPhone>
          </div>
          {/* Fading overlay to blend into background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-30 flex flex-col items-center"
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight mb-8">
            Stop settling for <br/> outdated communication.
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="bg-brand text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 w-full sm:w-auto">
              Join Beta
            </button>
            <button className="bg-white border border-border/80 text-foreground px-8 py-4 rounded-full text-[15px] font-medium hover:bg-soft-bg transition-colors shadow-sm w-full sm:w-auto">
              Reserve Username
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
