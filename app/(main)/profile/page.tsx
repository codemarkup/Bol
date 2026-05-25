"use client";

import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ProfileNavigation } from "@/components/profile/ProfileNavigation";
import { ProfileEdit } from "@/components/profile/ProfileEdit";

export default function ProfilePage() {
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <ProfileNavigation onEditProfile={() => setShowMainOnMobile(true)} />;
  const main = <ProfileEdit onBack={() => setShowMainOnMobile(false)} />;

  return (
    <ResponsiveLayout 
      sidebarContent={sidebar} 
      mainContent={main} 
      showMainOnMobile={showMainOnMobile} 
      onBackToSidebar={() => setShowMainOnMobile(false)} 
    />
  );
}
