import fs from 'fs';
import path from 'path';

const dirs = [
  'app/(main)/calls', 'components/calls',
  'app/(main)/contacts', 'components/contacts',
  'app/(main)/ai', 'components/ai',
  'app/(main)/scheduled', 'components/scheduled',
  'app/(main)/settings', 'components/settings'
];

dirs.forEach(d => fs.mkdirSync(path.join(process.cwd(), d), { recursive: true }));

const files = {
  // Calls
  'app/(main)/calls/page.tsx': `"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { CallsList } from "@/components/calls/CallsList";
import { CallDetail } from "@/components/calls/CallDetail";
export default function CallsPage() {
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <CallsList activeId={activeCallId} onSelect={(id) => { setActiveCallId(id); setShowMainOnMobile(true); }} />;
  const main = <CallDetail id={activeCallId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}`,
  'components/calls/CallsList.tsx': `import { Phone } from "lucide-react";
export function CallsList({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4"><h1 className="text-2xl font-bold mb-4">Calls</h1><div className="flex gap-2 mb-4"><button className="bg-[#0D9488]/10 text-[#0D9488] px-4 py-1.5 rounded-full font-medium">All</button><button className="bg-[#F6F8F7] text-[#6B7280] px-4 py-1.5 rounded-full font-medium">Missed</button></div><button onClick={() => onSelect(1)} className="flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl"><div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><Phone className="w-5 h-5 text-gray-500" /></div><div className="flex-1 text-left"><div className="font-semibold text-[#0F0F14]">Alice</div><div className="text-sm text-[#6B7280]">Incoming • Today</div></div></button></div>;
}`,
  'components/calls/CallDetail.tsx': `import { EmptyStateView } from "@/components/layout/EmptyStateView";
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
}`,

  // Contacts
  'app/(main)/contacts/page.tsx': `"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ContactsList } from "@/components/contacts/ContactsList";
import { ContactProfile } from "@/components/contacts/ContactProfile";
export default function ContactsPage() {
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <ContactsList activeId={activeContactId} onSelect={(id) => { setActiveContactId(id); setShowMainOnMobile(true); }} />;
  const main = <ContactProfile id={activeContactId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}`,
  'components/contacts/ContactsList.tsx': `import { Users } from "lucide-react";
export function ContactsList({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4"><h1 className="text-2xl font-bold mb-4">Contacts</h1><div className="mb-4 text-sm font-semibold text-[#6B7280]">A</div><button onClick={() => onSelect(1)} className="flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl"><div className="w-12 h-12 bg-gray-200 rounded-full relative"><div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div></div><div className="flex-1 text-left"><div className="font-semibold text-[#0F0F14]">Alice</div><div className="text-sm text-[#6B7280]">Online</div></div></button></div>;
}`,
  'components/contacts/ContactProfile.tsx': `import { EmptyStateView } from "@/components/layout/EmptyStateView";
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
}`,

  // AI
  'app/(main)/ai/page.tsx': `"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { AINavigation } from "@/components/ai/AINavigation";
import { AIFeatureDetail } from "@/components/ai/AIFeatureDetail";
export default function AIPage() {
  const [activeFeatureId, setActiveFeatureId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <AINavigation activeId={activeFeatureId} onSelect={(id) => { setActiveFeatureId(id); setShowMainOnMobile(true); }} />;
  const main = <AIFeatureDetail id={activeFeatureId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}`,
  'components/ai/AINavigation.tsx': `import { Sparkles, FileText, Globe } from "lucide-react";
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
}`,
  'components/ai/AIFeatureDetail.tsx': `import { EmptyStateView } from "@/components/layout/EmptyStateView";
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
}`,

  // Scheduled
  'app/(main)/scheduled/page.tsx': `"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ScheduledList } from "@/components/scheduled/ScheduledList";
import { ScheduledDetail } from "@/components/scheduled/ScheduledDetail";
export default function ScheduledPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <ScheduledList activeId={activeId} onSelect={(id) => { setActiveId(id); setShowMainOnMobile(true); }} />;
  const main = <ScheduledDetail id={activeId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}`,
  'components/scheduled/ScheduledList.tsx': `import { Clock } from "lucide-react";
export function ScheduledList({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4"><h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Clock className="w-6 h-6 text-[#0D9488]" /> Scheduled</h1><div className="flex gap-2 mb-4"><button className="bg-[#0D9488]/10 text-[#0D9488] px-4 py-1.5 rounded-full font-medium">Upcoming</button><button className="bg-[#F6F8F7] text-[#6B7280] px-4 py-1.5 rounded-full font-medium">Sent</button></div><button onClick={() => onSelect(1)} className="flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left"><div className="w-12 h-12 bg-gray-200 rounded-full"></div><div className="flex-1 min-w-0"><div className="font-semibold text-[#0F0F14]">Bob</div><div className="text-sm text-[#6B7280] truncate">Happy birthday man! Have a...</div></div><div className="text-xs font-medium text-[#0D9488] shrink-0">10:00 AM</div></button></div>;
}`,
  'components/scheduled/ScheduledDetail.tsx': `import { EmptyStateView } from "@/components/layout/EmptyStateView";
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
}`,

  // Settings
  'app/(main)/settings/page.tsx': `"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { SettingsDetail } from "@/components/settings/SettingsDetail";
export default function SettingsPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <SettingsNavigation activeId={activeId} onSelect={(id) => { setActiveId(id); setShowMainOnMobile(true); }} />;
  const main = <SettingsDetail id={activeId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}`,
  'components/settings/SettingsNavigation.tsx': `import { Settings, Shield, User, Bell } from "lucide-react";
export function SettingsNavigation({ activeId, onSelect }: any) {
  return <div className="w-[320px] lg:w-[380px] h-full border-r border-[#ECECEC] flex flex-col p-4"><h1 className="text-2xl font-bold mb-6">Settings</h1><div className="bg-[#F6F8F7] p-4 rounded-xl flex items-center gap-4 mb-6"><div className="w-14 h-14 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-xl font-bold">S</div><div><div className="font-semibold text-lg">Satoshi</div><div className="text-sm text-[#6B7280]">+1 234 567 8900</div></div></div><div className="space-y-2"><button onClick={() => onSelect(1)} className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left"><User className="w-5 h-5 text-gray-500" /><span className="font-medium text-[#0F0F14]">Account</span></button><button onClick={() => onSelect(2)} className="w-full flex items-center gap-3 p-3 bg-[#0D9488]/10 rounded-xl text-left text-[#0D9488]"><Shield className="w-5 h-5" /><span className="font-medium">Privacy & Security</span></button><button onClick={() => onSelect(3)} className="w-full flex items-center gap-3 p-3 hover:bg-[#F6F8F7] rounded-xl text-left"><Bell className="w-5 h-5 text-gray-500" /><span className="font-medium text-[#0F0F14]">Notifications</span></button></div></div>;
}`,
  'components/settings/SettingsDetail.tsx': `import { EmptyStateView } from "@/components/layout/EmptyStateView";
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
}`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(process.cwd(), filepath), content);
}
console.log("Pages generated!");
