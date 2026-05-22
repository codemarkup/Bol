import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { TheTrollSection } from "@/components/sections/TheTrollSection";
import { DailyChatFrustrations } from "@/components/sections/DailyChatFrustrations";
import { AIFeaturesShowcase } from "@/components/sections/AIFeaturesShowcase";
import { GroupChatsReimagined } from "@/components/sections/GroupChatsReimagined";
import { Privacy } from "@/components/sections/Privacy";
import { MultiDevice } from "@/components/sections/MultiDevice";
import { BuiltDifferent } from "@/components/sections/BuiltDifferent";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans selection:bg-brand/20">
      <Navbar />
      <Hero />
      <TheTrollSection />
      <DailyChatFrustrations />
      <AIFeaturesShowcase />
      <GroupChatsReimagined />
      <MultiDevice />
      <Privacy />
      <BuiltDifferent />
      <FinalCTA />
      <Footer />
    </main>
  );
}
