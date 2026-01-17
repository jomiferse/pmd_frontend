import type { ReactNode } from "react";
import Link from "next/link";
import AnimatedGradientText from "../components/magicui/AnimatedGradientText";
import MagicButton from "../components/magicui/MagicButton";
import MagicFooter from "../components/magicui/MagicFooter";

const marketingUrl = (process.env.NEXT_PUBLIC_MARKETING_URL || "https://pmdalerts.com").replace(/\/$/, "");
const navItems = [
  { href: `${marketingUrl}/pricing`, label: "Pricing" },
  { href: `${marketingUrl}/faq`, label: "FAQ" },
  { href: `${marketingUrl}/learn`, label: "Learn" },
  { href: `${marketingUrl}/blog`, label: "Blog" }
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fog text-ink">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={marketingUrl} className="text-sm font-semibold uppercase tracking-[0.25em] text-ink">
            <AnimatedGradientText>PMD</AnimatedGradientText>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate">
            <div className="hidden items-center gap-4 rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-soft lg:flex">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </div>
            <MagicButton href="/login" variant="ghost" size="sm">
              Login
            </MagicButton>
            <MagicButton href="/register" size="sm">
              Get started
            </MagicButton>
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
