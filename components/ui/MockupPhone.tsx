"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function MockupPhone({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] shadow-2xl shrink-0 transition-all",
        "h-[500px] w-[240px] [@media(min-height:800px)]:h-[600px] [@media(min-height:800px)]:w-[280px]",
        className
      )}
    >
      {/* Side buttons */}
      <div className="absolute -left-[9px] top-[72px] w-[3px] h-[26px] bg-gray-800 rounded-l-lg"></div>
      <div className="absolute -left-[9px] top-[124px] w-[3px] h-[46px] bg-gray-800 rounded-l-lg"></div>
      <div className="absolute -left-[9px] top-[178px] w-[3px] h-[46px] bg-gray-800 rounded-l-lg"></div>
      <div className="absolute -right-[9px] top-[142px] w-[3px] h-[64px] bg-gray-800 rounded-r-lg"></div>

      {/* Screen container */}
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
        {/* Dynamic Island */}
        <div className="absolute top-2 inset-x-0 mx-auto w-[90px] h-[25px] bg-black rounded-full z-20 flex items-center justify-between px-2">
           <div className="w-2 h-2 rounded-full bg-[#111] border-[0.5px] border-white/10"></div>
           <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
        </div>

        {/* Inner Content */}
        <div className="relative w-full h-full pt-10 pb-8 flex flex-col bg-[#F6F8F7]">
          {children}
        </div>
      </div>
    </div>
  );
}
