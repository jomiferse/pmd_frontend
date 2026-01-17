import type { ReactNode } from "react";
import Link from "next/link";
import AnimatedGradientText from "../components/magicui/AnimatedGradientText";
import MagicFooter from "../components/magicui/MagicFooter";

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://pmd.com";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fog text-ink">
      <header className="border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={marketingUrl} className="text-sm font-semibold uppercase tracking-[0.25em] text-ink">
            <AnimatedGradientText>PMD</AnimatedGradientText>
          </Link>
          <nav className="flex items-center gap-3 text-xs text-slate">
            <Link href={`${marketingUrl}/pricing`} className="transition hover:text-ink">
              Pricing
            </Link>
            <Link href={marketingUrl} className="transition hover:text-ink">
              Marketing site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        {children}
      </main>
      <MagicFooter />
    </div>
  );
}
