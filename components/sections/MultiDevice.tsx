"use client";

import { motion } from "framer-motion";
import { Laptop, Smartphone, Tablet } from "lucide-react";

export function MultiDevice() {
  return (
    <section className="py-32 bg-white border-y border-border/30">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            Every device. <br className="hidden md:block" />
            <span className="text-muted-foreground">No "primary phone" nonsense.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            True cloud sync. Drop your phone in the ocean, open your laptop, and keep typing. It just works.
          </p>
        </motion.div>

        <div className="relative w-full h-[400px] flex justify-center items-center">
          
          {/* Laptop Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="absolute z-10 w-[600px] h-[340px] bg-white border-[6px] border-gray-800 rounded-t-3xl rounded-b-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex-1 bg-surface/30 p-4 border-b border-border/50 flex">
              {/* Sidebar */}
              <div className="w-48 border-r border-border/50 pr-4 hidden sm:flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-brand/10 rounded-lg w-full"></div>
                <div className="h-8 bg-transparent rounded-lg w-full"></div>
              </div>
              {/* Main Chat */}
              <div className="flex-1 pl-4 flex flex-col justify-end pb-4 gap-2 relative">
                <div className="w-48 h-10 bg-brand text-white rounded-lg rounded-br-sm absolute bottom-4 right-4 text-[10px] p-2">
                  Yes, the presentation is ready!
                </div>
              </div>
            </div>
            <div className="h-6 bg-gray-300 w-[110%] -ml-[5%] rounded-b-xl relative z-20 shadow-inner flex justify-center items-start pt-1">
              <div className="w-16 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </motion.div>

          {/* Tablet Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            whileInView={{ opacity: 1, x: 180, rotate: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute z-20 w-[240px] h-[320px] bg-white border-[6px] border-gray-800 rounded-3xl shadow-xl flex flex-col overflow-hidden hidden md:flex"
          >
             <div className="flex-1 bg-surface/30 relative">
               <div className="absolute right-4 bottom-4 w-32 h-8 bg-brand rounded-lg rounded-br-sm"></div>
             </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: -50, y: 50, rotate: -15 }}
            whileInView={{ opacity: 1, x: -220, y: 40, rotate: -8 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute z-30 w-[140px] h-[280px] bg-white border-[4px] border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden hidden sm:flex"
          >
             <div className="flex-1 bg-surface/30 relative">
                <div className="absolute top-2 inset-x-0 mx-auto w-[40px] h-[12px] bg-black rounded-full"></div>
               <div className="absolute right-2 bottom-4 w-20 h-6 bg-brand rounded-md rounded-br-sm"></div>
             </div>
          </motion.div>

        </div>

        <div className="flex gap-12 mt-16 text-muted-foreground">
          <div className="flex items-center gap-2"><Laptop className="w-5 h-5" /> <span>Mac & Windows</span></div>
          <div className="flex items-center gap-2"><Tablet className="w-5 h-5" /> <span>iPad & Tablets</span></div>
          <div className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> <span>iOS & Android</span></div>
        </div>

      </div>
    </section>
  );
}
