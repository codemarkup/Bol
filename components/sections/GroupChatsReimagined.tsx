"use client";

import { motion } from "framer-motion";
import { Pin, Calendar, BarChart2, MessageSquare } from "lucide-react";

export function GroupChatsReimagined() {
  return (
    <section className="py-32 bg-soft-bg relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            Group chats should not feel like comment sections.
          </h2>
          <p className="text-lg text-muted-foreground">
            Structure your chaos. Threads, polls, pinned resources, and shared spaces. Everything in its right place.
          </p>
        </motion.div>

        {/* Visual grid representing organized spaces vs chaotic chats */}
        <div className="grid md:grid-cols-3 gap-6 w-full">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-2 bg-white rounded-[2rem] border border-border/60 p-8 shadow-sm flex flex-col gap-6"
          >
            <div className="flex items-center gap-3 border-b pb-4">
              <MessageSquare className="w-5 h-5 text-brand" />
              <span className="font-semibold text-lg">Active Threads</span>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-surface/30 p-4 rounded-xl">
                <div>
                  <h4 className="font-medium text-foreground">Dinner Friday?</h4>
                  <p className="text-xs text-muted-foreground mt-1">12 replies · Last active 5m ago</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=12" alt="Avatar" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=5" alt="Avatar" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-surface/30 p-4 rounded-xl opacity-60">
                <div>
                  <h4 className="font-medium text-foreground">Gift for Mom</h4>
                  <p className="text-xs text-muted-foreground mt-1">3 replies · Last active yesterday</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[2rem] border border-border/60 p-6 shadow-sm flex-1 flex flex-col justify-center gap-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pin className="w-4 h-4 text-brand" />
                <span className="font-semibold">Pinned</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-lg text-sm font-medium">Wifi: GuestNet2024!</div>
              <div className="bg-surface/50 p-3 rounded-lg text-sm font-medium">Gate Code: 5124</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-brand text-white rounded-[2rem] p-6 shadow-md flex-1 flex flex-col justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Upcoming</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Movie Night</h3>
              <p className="text-white/80 text-sm">Tomorrow, 8:00 PM</p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
