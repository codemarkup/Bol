"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ScheduledList } from "@/components/scheduled/ScheduledList";
import { ScheduledDetail } from "@/components/scheduled/ScheduledDetail";
export default function ScheduledPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <ScheduledList activeId={activeId} onSelect={(id: number) => { setActiveId(id); setShowMainOnMobile(true); }} />;
  const main = <ScheduledDetail id={activeId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
