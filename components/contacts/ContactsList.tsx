import { Users } from "lucide-react";
export function ContactsList({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4"><h1 className="text-2xl font-bold mb-4">Contacts</h1><div className="mb-4 text-sm font-semibold text-[#6B7280]">A</div><button onClick={() => onSelect(1)} className="flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl"><div className="w-12 h-12 bg-gray-200 rounded-full relative"><div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div></div><div className="flex-1 text-left"><div className="font-semibold text-[#0F0F14]">Alice</div><div className="text-sm text-[#6B7280]">Online</div></div></button></div>;
}
