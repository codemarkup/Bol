import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Users, MessageSquare, Phone, Video, Ban } from "lucide-react";
export function ContactProfile({ id, onBack }: any) {
  if (!id) return <EmptyStateView icon={Users} title="No Contact Selected" description="Select a contact to view their profile." />;
  return <div className="w-full h-full flex flex-col p-8 overflow-y-auto relative">
    <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
    <div className="flex flex-col items-center mb-8 mt-12 md:mt-0">
      <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
      <h2 className="text-3xl font-bold">Alice</h2>
      <p className="text-[#6B7280]">alice@example.com</p>
    </div>
    <div className="flex justify-center gap-4 mb-8">
      <button className="flex flex-col items-center text-[#0D9488] hover:scale-105 transition-transform"><div className="w-14 h-14 bg-[#0D9488]/10 rounded-full flex items-center justify-center mb-2"><MessageSquare className="w-6 h-6" /></div><span className="font-medium text-sm">Message</span></button>
      <button className="flex flex-col items-center text-[#0D9488] hover:scale-105 transition-transform"><div className="w-14 h-14 bg-[#0D9488]/10 rounded-full flex items-center justify-center mb-2"><Phone className="w-6 h-6" /></div><span className="font-medium text-sm">Audio</span></button>
      <button className="flex flex-col items-center text-[#0D9488] hover:scale-105 transition-transform"><div className="w-14 h-14 bg-[#0D9488]/10 rounded-full flex items-center justify-center mb-2"><Video className="w-6 h-6" /></div><span className="font-medium text-sm">Video</span></button>
    </div>
    <div className="border-t border-[#ECECEC] pt-6 mt-auto">
      <button className="flex items-center gap-3 text-red-500 hover:bg-red-50 p-3 rounded-xl w-full font-medium"><Ban className="w-5 h-5" /> Block Contact</button>
    </div>
  </div>;
}
