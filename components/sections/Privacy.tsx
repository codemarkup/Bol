"use client";

import { motion } from "framer-motion";
import { Lock, EyeOff, UserX, Shield } from "lucide-react";

const features = [
  {
    icon: <UserX className="w-5 h-5" />,
    title: "No Phone Number Needed",
    description: "Your identity is yours. Connect with usernames, not personal details."
  },
  {
    icon: <EyeOff className="w-5 h-5" />,
    title: "Per-Contact Read Receipts",
    description: "Granular control. On for your partner, off for your boss."
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Decoy Mode",
    description: "A secondary PIN opens a completely different, clean inbox."
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Anonymous Groups",
    description: "Join community groups without revealing your identity to others."
  }
];

export function Privacy() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-soft-bg via-background to-background pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 bg-white border border-border/80 shadow-xl shadow-brand/5 rounded-2xl flex items-center justify-center mb-12"
        >
          <Lock className="w-8 h-8 text-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-2xl mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            Privacy should be intelligent.
          </h2>
          <p className="text-lg text-muted-foreground">
            End-to-end encryption is the baseline, not the feature. We built privacy tools that actually protect your peace of mind in the real world.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-8 w-full max-w-4xl">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
              className="bg-white border border-border/60 rounded-2xl p-8 hover:shadow-lg hover:shadow-brand/5 transition-all group"
            >
              <div className="w-12 h-12 bg-soft-bg rounded-full flex items-center justify-center text-brand mb-6 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
