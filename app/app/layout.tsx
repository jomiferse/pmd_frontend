import type { ReactNode } from "react";
import Link from "next/link";
import AppGuard from "../components/AppGuard";
import MagicBadge from "../components/magicui/MagicBadge";
import MagicCard from "../components/magicui/MagicCard";
import Spotlight from "../components/magicui/Spotlight";

const navItems = [
  { href: "/app/alerts", label: "Alerts" },
  { href: "/app/copilot", label: "Copilot Activity" },
  { href: "/app/telegram", label: "Telegram Linking" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" }
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppGuard>
      <div className="mx-auto min-h-screen max-w-6xl px-4 pb-12 pt-8 sm:px-6">
        <MagicCard className="relative overflow-hidden">
          <Spotlight className="-left-20 -top-20 opacity-60" size={300} />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <MagicBadge>PMD Ops</MagicBadge>
                <h1 className="mt-3 text-2xl font-semibold">Operational Control</h1>
                <p className="mt-2 text-sm text-slate">
                  Monitor alerts, Copilot runs, and billing in one secure cockpit.
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate shadow-soft transition hover:border-ink hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </MagicCard>
        <main className="mt-8">{children}</main>
      </div>
    </AppGuard>
  );
}
