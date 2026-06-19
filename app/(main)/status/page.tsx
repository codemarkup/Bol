"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { PulseFeed } from "@/components/pulse/PulseFeed";
import { PulseViewer } from "@/components/pulse/PulseViewer";
import { PulseEmptyState } from "@/components/pulse/PulseEmptyState";
import { PulseCreationModal } from "@/components/pulse/PulseCreationModal";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PulsePageContent() {
  const [activePulseUserId, setActivePulseUserId] = useState<string | null>(null);
  const [activePulseStartIndex, setActivePulseStartIndex] = useState<number>(0);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pulseViewedTrigger, setPulseViewedTrigger] = useState<{ poster_id: string, ts: number } | null>(null);
  
  const searchParams = useSearchParams();
  const initUser = searchParams.get('user');

  useEffect(() => {
    document.title = "Status — Bol";
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    if (initUser && !activePulseUserId) {
      handleSelectPulseUser(initUser, 0);
    }
  }, [initUser]);

  const handleSelectPulseUser = (userId: string, startIndex: number = 0) => {
    setActivePulseUserId(userId);
    setActivePulseStartIndex(startIndex);
    setShowMainOnMobile(true);
  };

  const handlePulseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsCreationModalOpen(false);
  };

  const sidebar = (
    <PulseFeed
      currentUserId={currentUserId}
      activeUserId={activePulseUserId}
      onSelectUser={handleSelectPulseUser}
      onCreatePulse={() => setIsCreationModalOpen(true)}
      refreshTrigger={refreshTrigger}
      pulseViewedTrigger={pulseViewedTrigger}
    />
  );

  const main = activePulseUserId ? (
    <PulseViewer
      userId={activePulseUserId}
      currentUserId={currentUserId}
      startIndex={activePulseStartIndex}
      onBack={() => setShowMainOnMobile(false)}
      onClose={() => { 
        setActivePulseUserId(null); 
        setShowMainOnMobile(false); 
        setRefreshTrigger(p => p + 1); // Instantly reload feed to show updated views
      }}
      onNextUser={(nextUserId) => handleSelectPulseUser(nextUserId)}
      onPulseViewed={(poster_id) => setPulseViewedTrigger({ poster_id, ts: Date.now() })}
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
          onCreated={handlePulseCreated}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

export default function PulsePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Status...</div>}>
      <PulsePageContent />
    </Suspense>
  );
}
