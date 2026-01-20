import Link from "next/link";
import AnimatedGradientText from "./AnimatedGradientText";
import Button from "./Button";

const marketingUrl = (process.env.NEXT_PUBLIC_MARKETING_URL || "https://pmdalerts.com").replace(/\/$/, "");
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const navItems = [
  { href: `${marketingUrl}/pricing`, label: "Pricing" },
  { href: `${marketingUrl}/faq`, label: "FAQ" }
];

export default function Navbar() {
  return (
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
          <Button href={`${appUrl}/login`} variant="ghost" size="sm">
            Login
          </Button>
          <Button href={`${appUrl}/register`} size="sm">
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}
