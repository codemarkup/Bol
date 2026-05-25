import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Settings, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
export function SettingsDetail({ id, onBack }: any) {
  if (!id) return <EmptyStateView icon={Settings} title="Settings" description="Select a setting category." />;
  return <div className="w-full h-full p-8 overflow-y-auto relative">
    <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
    <div className="max-w-2xl mx-auto mt-8 md:mt-0">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><Shield className="w-8 h-8 text-[#0D9488]" /> Privacy & Security</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-[#F6F8F7] p-6 rounded-2xl">
          <div><h3 className="font-semibold text-[#0F0F14] text-lg">Read Receipts</h3><p className="text-[#6B7280]">Let others know when you've read their messages.</p></div>
          <Switch checked={true} />
        </div>
        <div className="flex items-center justify-between bg-[#F6F8F7] p-6 rounded-2xl border-l-4 border-l-[#0D9488]">
          <div><h3 className="font-semibold text-[#0D9488] text-lg">Decoy Mode</h3><p className="text-[#6B7280]">Hide sensitive chats with a secondary PIN.</p></div>
          <Switch checked={false} />
        </div>
        <div className="flex items-center justify-between bg-[#F6F8F7] p-6 rounded-2xl border-l-4 border-l-[#0D9488]">
          <div><h3 className="font-semibold text-[#0D9488] text-lg">Anonymous Group Mode</h3><p className="text-[#6B7280]">Join groups without revealing your phone number.</p></div>
          <Switch checked={true} />
        </div>
      </div>
    </div>
  </div>;
}
