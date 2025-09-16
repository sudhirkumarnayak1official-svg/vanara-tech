import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sparkles, Shield, Satellite, Video, Bell, Map } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ShellProps = {
  children: React.ReactNode;
  onSync?: () => void;
  webhookUrl?: string;
  setWebhookUrl?: (url: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
};

export function Shell({ children, onSync, webhookUrl, setWebhookUrl }: ShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <Link to="/" className="group inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-md grid place-items-center neon-ring bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-lg sm:text-xl font-bold font-display neon-text">Vanara System</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Stealth Surveillance</div>
            </div>
          </Link>

          <nav className="ml-auto hidden md:flex items-center gap-2">
            <a href="#overview" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Overview</a>
            <a href="#detections" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Detections</a>
            <a href="#alerts" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Alerts</a>
            <a href="#satellite" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Satellite View</a>
            <a href="#live" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Live Feed</a>
          </nav>

          <button
            className="md:hidden ml-auto p-2 rounded-md border border-border hover:bg-accent/40"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle navigation"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
            <a href="#overview" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Overview</a>
            <a href="#detections" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Detections</a>
            <a href="#alerts" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Alerts</a>
            <a href="#satellite" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Satellite View</a>
            <a href="#live" className="px-3 py-2 rounded-md hover:bg-accent/50 transition text-sm">Live Feed</a>
          </div>
        )}

        <div className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Video className="h-4 w-4 text-primary" />
              <span>Dark mode · Neon green · Cinematic HUD</span>
            </div>
            <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
              <input
                value={webhookUrl ?? ""}
                onChange={(e) => setWebhookUrl && setWebhookUrl(e.target.value)}
                placeholder="Webhook URL (Google Sheets / n8n)"
                className="w-full sm:w-[340px] h-9 px-3 rounded-md bg-secondary/70 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={onSync} className="h-9">Sync Logs</Button>
            </div>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6")}>{children}</main>

      <footer className="mt-10 border-t border-border/60 bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid sm:grid-cols-3 gap-4 items-center">
          <div className="text-xs text-muted-foreground">
            Built with no-code tools | Ethical Surveillance | © Vanara 2025
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Inspired by the Vanaras—forest warriors of ancient epics—our system blends invisibility with intelligence.
          </div>
          <div className="sm:justify-self-end">
            <img
              alt="QR to open on mobile"
              className="h-16 w-16 rounded-md neon-ring"
              src={
                typeof window !== "undefined"
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.href)}`
                  : ""
              }
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
