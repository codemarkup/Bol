import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background py-12 border-t border-border/40">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] bg-brand flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Bol.</span>
        </div>

        <div className="flex items-center gap-6 text-[13px] font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#careers" className="hover:text-foreground transition-colors">Careers</Link>
          <Link href="#terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="#privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>

        <div className="text-[13px] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Bol Messaging. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
