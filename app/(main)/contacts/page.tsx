"use client";
import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ContactsList } from "@/components/contacts/ContactsList";
import { ContactProfile } from "@/components/contacts/ContactProfile";
export default function ContactsPage() {
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [showMainOnMobile, setShowMainOnMobile] = useState(false);
  const sidebar = <ContactsList activeId={activeContactId} onSelect={(id: number) => { setActiveContactId(id); setShowMainOnMobile(true); }} />;
  const main = <ContactProfile id={activeContactId} onBack={() => setShowMainOnMobile(false)} />;
  return <ResponsiveLayout sidebarContent={sidebar} mainContent={main} showMainOnMobile={showMainOnMobile} onBackToSidebar={() => setShowMainOnMobile(false)} />;
}
