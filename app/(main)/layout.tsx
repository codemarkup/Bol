import { Sidebar } from "@/components/chat/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen bg-[#B2C8C4] flex items-center justify-center overflow-hidden">
      <div className="flex w-full h-full bg-white text-[#0F0F14] font-sans selection:bg-brand/20 rounded-[20px] shadow-2xl relative">
        <div className="hidden lg:block h-full z-30">
          <Sidebar />
        </div>
        <div className="flex-1 h-full min-w-0 relative bg-white z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
