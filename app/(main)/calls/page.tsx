"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { CallsList } from "@/components/calls/CallsList";
import { CallDetail } from "@/components/calls/CallDetail";
import { createClient } from "@/lib/supabase/client";

export default function CallsPage() {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const sidebar = <CallsList currentUserId={currentUserId} activeId={activeCallId} onSelect={(id: string) => { setActiveCallId(id); setShowMainOnMobile(true); }} />;
  const main = <CallDetail id={activeCallId} currentUserId={currentUserId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
