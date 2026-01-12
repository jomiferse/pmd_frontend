import Link from "next/link";
import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

const links = [
  { label: "Learn", href: "/learn" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Login", href: "/login" },
  { label: "Create account", href: "/register" }
];

export default function InternalLinks() {
  return (
    <section className="space-y-4">
      <MagicBadge>Explore PMD</MagicBadge>
      <MagicCard className="flex flex-wrap items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate/20 bg-white/80 px-4 py-2 text-sm text-slate transition hover:border-ink/30 hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </MagicCard>
    </section>
  );
}
