"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { AINavigation } from "@/components/ai/AINavigation";
import { AIFeatureDetail } from "@/components/ai/AIFeatureDetail";
export default function AIPage() {
  const [activeFeatureId, setActiveFeatureId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <AINavigation activeId={activeFeatureId} onSelect={(id: number) => { setActiveFeatureId(id); setShowMainOnMobile(true); }} />;
  const main = <AIFeatureDetail id={activeFeatureId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
