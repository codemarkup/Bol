"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function BuiltDifferent() {
  return (
    <section className="py-32 bg-surface/50 border-t border-border/40">
      <div className="max-w-4xl mx-auto px-6 text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm border border-border/50 mb-8"
        >
          <Heart className="w-6 h-6 text-brand" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-8"
        >
          Built in Pakistan.<br />
          <span className="text-muted-foreground">Designed for the world.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12"
        >
          We are a small team of engineers and designers tired of bloatware, corporate agendas, and outdated messaging apps. We built Bol because we wanted a tool that respects our time, our attention, and our privacy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white p-2 rounded-full border border-border/60 shadow-sm max-w-md mx-auto flex items-center"
        >
          <input 
            type="email" 
            placeholder="Enter your email for early access" 
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm"
          />
          <button className="bg-foreground text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors">
            Join Waitlist
          </button>
        </motion.div>

      </div>
    </section>
  );
}
