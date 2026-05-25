"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { SettingsDetail } from "@/components/settings/SettingsDetail";
export default function SettingsPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <SettingsNavigation activeId={activeId} onSelect={(id: number) => { setActiveId(id); setShowMainOnMobile(true); }} />;
  const main = <SettingsDetail id={activeId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
