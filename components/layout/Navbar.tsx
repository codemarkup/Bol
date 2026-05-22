"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 inset-x-0 mx-auto z-50 flex items-center justify-between px-6 py-3 max-w-4xl bg-white/70 backdrop-blur-md border border-border/60 rounded-full shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
        </div>
        <span className="font-semibold text-foreground tracking-tight text-lg">Bol.</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-muted-foreground">
        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="#privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link href="#ai" className="hover:text-foreground transition-colors">AI</Link>
        <Link href="#download" className="hover:text-foreground transition-colors">Download</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/signin" className="hidden sm:block text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          Sign In
        </Link>
        <button className="bg-foreground text-white px-5 py-2 rounded-full text-[14px] font-medium hover:bg-foreground/90 transition-all shadow-sm">
          Get Early Access
        </button>
      </div>
    </motion.nav>
  );
}
