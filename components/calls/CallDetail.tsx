import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Phone, Video, Mic } from "lucide-react";
export function CallDetail({ id, onBack }: any) {
  if (!id) return <EmptyStateView icon={Phone} title="No Call Selected" description="Select a call from the history to view details." />;
  return <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
    <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
    <div className="w-32 h-32 bg-gray-200 rounded-full mb-6"></div>
    <h2 className="text-3xl font-bold mb-2">Alice</h2>
    <p className="text-[#6B7280] mb-8">+1 234 567 8900</p>
    <div className="flex gap-4">
      <button className="w-14 h-14 bg-[#0D9488] rounded-full flex items-center justify-center text-white"><Phone className="w-6 h-6" /></button>
      <button className="w-14 h-14 bg-[#0D9488] rounded-full flex items-center justify-center text-white"><Video className="w-6 h-6" /></button>
    </div>
  </div>;
}
