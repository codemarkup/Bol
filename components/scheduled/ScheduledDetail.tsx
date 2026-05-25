import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Clock, Send, Edit, Trash2 } from "lucide-react";
export function ScheduledDetail({ id, onBack }: any) {
  if (!id) return <EmptyStateView icon={Clock} title="No Message Selected" description="Select a scheduled message to view or edit." />;
  return <div className="w-full h-full p-8 overflow-y-auto relative">
    <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
    <div className="max-w-2xl mx-auto mt-8 md:mt-0">
      <div className="bg-[#0D9488]/10 text-[#0D9488] p-5 rounded-2xl flex items-center gap-4 mb-8">
        <Clock className="w-8 h-8" />
        <div><div className="font-bold text-lg">Scheduled for Tomorrow</div><div className="text-sm text-[#0D9488]/80">10:00 AM • Recipient: Bob</div></div>
      </div>
      <div className="bg-[#F6F8F7] p-6 rounded-2xl mb-8">
        <p className="text-[#0F0F14] text-lg leading-relaxed">Happy birthday man! Have a great one.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button className="px-6 py-3 bg-[#0D9488] text-white font-medium rounded-xl flex items-center gap-2 hover:bg-[#0D9488]/90 transition-all shadow-lg shadow-[#0D9488]/20"><Send className="w-5 h-5" /> Send Now</button>
        <button className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all"><Edit className="w-5 h-5" /> Edit</button>
        <button className="px-6 py-3 bg-red-50 text-red-500 font-medium rounded-xl flex items-center gap-2 hover:bg-red-100 transition-all ml-auto"><Trash2 className="w-5 h-5" /> Cancel</button>
      </div>
    </div>
  </div>;
}
