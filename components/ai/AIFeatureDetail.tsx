import { EmptyStateView } from "@/components/layout/EmptyStateView";
import { Sparkles, CheckCircle2 } from "lucide-react";
export function AIFeatureDetail({ id, onBack }: any) {
  if (!id) return <EmptyStateView icon={Sparkles} title="Select a Feature" description="Explore the AI capabilities powered by Gemini." />;
  return <div className="w-full h-full p-8 overflow-y-auto relative">
    <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-[#0D9488] font-medium">Back</button>
    <div className="max-w-2xl mx-auto mt-8 md:mt-0">
      <div className="w-16 h-16 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center text-[#0D9488] mb-6"><Sparkles className="w-8 h-8" /></div>
      <h2 className="text-3xl font-bold mb-4">Catch-Up Summaries</h2>
      <p className="text-lg text-[#6B7280] mb-8">Let AI read the long threads for you and catch you up in seconds.</p>
      <div className="bg-[#F6F8F7] border border-[#ECECEC] rounded-2xl p-6 mb-8 border-l-4 border-l-[#0D9488]">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" /> <span>Click the sparkle icon on any long chat.</span></li>
          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" /> <span>Gemini analyzes unread messages instantly.</span></li>
          <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" /> <span>Read a quick bulleted summary.</span></li>
        </ul>
      </div>
    </div>
  </div>;
}
