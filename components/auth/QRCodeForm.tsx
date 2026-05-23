"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function QRCodeForm() {
  const [cells, setCells] = useState<boolean[]>(new Array(25).fill(true));

  useEffect(() => {
    setCells(Array.from({ length: 25 }, () => Math.random() > 0.4));
  }, []);

  return (
    <div className="w-full flex flex-col items-center overflow-hidden py-4">
      <div className="flex flex-col items-center text-center mb-6">
        <h4 className="font-semibold text-foreground text-lg mb-2">Scan with your Bol app</h4>
        <ol className="text-sm text-muted-foreground text-left list-decimal list-inside space-y-1 mt-2">
          <li>Open Bol on your phone</li>
          <li>Go to Settings → Linked Devices</li>
          <li>Point your camera at this screen</li>
        </ol>
      </div>

      {/* QR Code Visual representation */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-md mb-6 relative flex items-center justify-center">
        <div className="w-48 h-48 border border-dashed border-gray-300 rounded-xl flex items-center justify-center relative bg-gray-50/50">
          {/* Fake QR pattern */}
          <div className="absolute inset-2 grid grid-cols-5 grid-rows-5 gap-1.5 opacity-30">
            {cells.map((visible, i) => (
              <div key={i} className={`bg-black rounded-sm ${visible ? 'opacity-100' : 'opacity-0'}`} />
            ))}
          </div>
          {/* Three corner squares */}
          <div className="absolute top-2 left-2 w-10 h-10 border-[4px] border-black rounded-md"></div>
          <div className="absolute top-2 right-2 w-10 h-10 border-[4px] border-black rounded-md"></div>
          <div className="absolute bottom-2 left-2 w-10 h-10 border-[4px] border-black rounded-md"></div>
          
          {/* Center Dot */}
          <div className="z-10 bg-white p-1.5 rounded-lg shadow-sm border border-border">
            <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center text-white font-bold text-sm">
              B.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="bg-brand text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm shadow-brand/20">
          ⏱ Expires in 4:58
        </div>
        <button className="flex items-center gap-1.5 text-brand text-xs font-medium hover:bg-brand/10 px-3 py-1 rounded-full transition-colors border border-brand/20 bg-brand/5">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      
      <p className="text-[11px] text-muted-foreground mt-2 text-center max-w-[200px]">
        Keep this window open. You'll be signed in automatically.
      </p>
    </div>
  );
}
