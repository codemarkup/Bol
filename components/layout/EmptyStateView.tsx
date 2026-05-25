"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface EmptyStateViewProps {
  icon: any;
  title: string;
  description: string;
}

export function EmptyStateView({ icon: Icon, title, description }: EmptyStateViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col items-center justify-center overflow-hidden p-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0D9488]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-md w-full flex flex-col items-center text-center z-10"
      >
        <motion.div 
          variants={itemVariants}
          className="w-24 h-24 bg-[#F6F8F7] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-[#ECECEC]"
        >
          <Icon className="w-12 h-12 text-[#9CA3AF]" strokeWidth={1.5} />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-2">
          <h2 className="text-2xl font-semibold text-[#0F0F14]">{title}</h2>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-[#6B7280] text-[15px] max-w-sm mx-auto">
            {description}
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8">
          <p className="text-[12px] text-[#9CA3AF] flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            End-to-end encrypted
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
