"use client";

import { motion } from "framer-motion";
import { ChatBubble, VoiceNoteBubble } from "../ui/ChatBubbles";

const frustrations = [
  {
    problem: "Important replies disappear in group chaos.",
    solution: "Keep conversations organized with threaded replies.",
    solutionUI: (
      <div className="flex flex-col gap-4">
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
      </div>
    )
  },
  {
    problem: "You never listen to voice notes.",
    solution: "Get instant voice note transcriptions, anywhere.",
    solutionUI: (
      <div className="flex flex-col gap-2">
        <VoiceNoteBubble duration="0:14" />
        <div className="ml-8 border-l-2 border-brand/20 pl-3">
          <div className="bg-white border border-border/50 shadow-sm rounded-xl rounded-tl-sm p-3 inline-block">
            <span className="text-[11px] font-semibold text-brand mb-1 block">Transcript</span>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Hey, I'm running about 5 minutes late. Go ahead and order the appetizers without me!
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export function DailyChatFrustrations() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-5xl w-full mx-auto px-6 flex flex-col gap-32">
        {frustrations.map((item, i) => (
          <div key={i} className="grid md:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {item.problem}
              </h2>
              <div className="flex items-center gap-3 mt-4 text-brand">
                <span className="w-8 h-[2px] bg-brand/30"></span>
                <p className="text-xl font-medium tracking-wide">{item.solution}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-soft-bg border border-border/60 rounded-[2rem] p-8 md:p-12 shadow-sm"
            >
              {item.solutionUI}
            </motion.div>

          </div>
        ))}
      </div>
    </section>
  );
}
