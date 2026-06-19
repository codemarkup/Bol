"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { PulseFeed } from "@/components/pulse/PulseFeed";
import { PulseViewer } from "@/components/pulse/PulseViewer";
import { PulseEmptyState } from "@/components/pulse/PulseEmptyState";
import { PulseCreationModal } from "@/components/pulse/PulseCreationModal";
import { createClient } from "@/lib/supabase/client";

export default function PulsePage() {
  const [activePulseUserId, setActivePulseUserId] = useState<string | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Pulse — Bol";
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const handleSelectPulseUser = (userId: string) => {
    setActivePulseUserId(userId);
    setShowMainOnMobile(true);
  };

  const sidebar = (
    <PulseFeed
      currentUserId={currentUserId}
      activeUserId={activePulseUserId}
      onSelectUser={handleSelectPulseUser}
      onCreatePulse={() => setIsCreationModalOpen(true)}
    />
  );

  const main = activePulseUserId ? (
    <PulseViewer
      userId={activePulseUserId}
      currentUserId={currentUserId}
      onBack={() => setShowMainOnMobile(false)}
      onClose={() => { setActivePulseUserId(null); setShowMainOnMobile(false); }}
      onNextUser={(nextUserId) => handleSelectPulseUser(nextUserId)}
    />
  ) : (
    <PulseEmptyState
      onCreatePulse={() => setIsCreationModalOpen(true)}
      onExplore={() => { /* maybe auto select a pulse */ }}
    />
  );

  return (
    <>
      <ResponsiveLayout
        sidebarContent={sidebar}
        mainContent={main}
        showMainOnMobile={showMainOnMobile}
        onBackToSidebar={() => setShowMainOnMobile(false)}
      />
      {isCreationModalOpen && (
        <PulseCreationModal
          onClose={() => setIsCreationModalOpen(false)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
