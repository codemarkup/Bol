import { Sparkles, FileText, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
export function AINavigation({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4">
    <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-[#0D9488] w-6 h-6" /> AI Features</h1>
    <div className="flex-1 overflow-y-auto">
      <div className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F7] rounded-xl text-left mb-2 cursor-pointer" onClick={() => onSelect(1)}>
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#0D9488]/10 rounded-full flex items-center justify-center text-[#0D9488]"><FileText className="w-5 h-5" /></div><div><div className="font-semibold text-[#0F0F14]">Catch-Up Summaries</div><div className="text-xs text-[#6B7280]">Summarize long threads</div></div></div>
        <Switch checked={true} />
      </div>
      <div className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F7] rounded-xl text-left mb-2 cursor-pointer" onClick={() => onSelect(2)}>
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#0D9488]/10 rounded-full flex items-center justify-center text-[#0D9488]"><Globe className="w-5 h-5" /></div><div><div className="font-semibold text-[#0F0F14]">Inline Translation</div><div className="text-xs text-[#6B7280]">Translate messages</div></div></div>
        <Switch checked={false} />
      </div>
    </div>
  </div>;
}
