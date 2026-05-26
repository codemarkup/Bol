"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { CallsList } from "@/components/calls/CallsList";
import { CallDetail } from "@/components/calls/CallDetail";
export default function CallsPage() {
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <CallsList activeId={activeCallId} onSelect={(id: number) => { setActiveCallId(id); setShowMainOnMobile(true); }} />;
  const main = <CallDetail id={activeCallId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
