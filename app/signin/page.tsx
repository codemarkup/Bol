import { LeftColumnArt } from "@/components/auth/LeftColumnArt";
import { AuthContainer } from "@/components/auth/AuthContainer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Sign In - Bol",
  description: "Messaging finally evolved.",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex bg-background font-sans text-foreground">
      {/* Mobile-only header (hidden on md and up) */}
      <div className="md:hidden fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <span className="font-bold text-xl tracking-tight text-brand">Bol.</span>
      </div>

      {/* Left Column - Brand Art (hidden on mobile) */}
      <div className="hidden md:flex w-[55%] h-screen sticky top-0 bg-[#0a0a0a] overflow-hidden">
        <LeftColumnArt />
      </div>

      {/* Right Column - Auth Forms */}
      <div className="w-full md:w-[45%] flex flex-col min-h-screen relative pt-20 md:pt-0">
        <div className="hidden md:block absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Bol
          </Link>
        </div>
        
        <AuthContainer />
      </div>
    </main>
  );
}
