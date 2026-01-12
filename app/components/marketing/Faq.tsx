import Link from "next/link";
import MagicAccordion from "../magicui/MagicAccordion";
import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

export const faqItems = [
  {
    title: "Is this financial advice?",
    content: "No. PMD is analytics only and does not provide financial advice."
  },
  {
    title: "Do you place trades automatically?",
    content: "No. PMD is read-only and never places orders on your behalf."
  },
  {
    title: "What markets are supported?",
    content:
      "PMD monitors Polymarket markets and lets you filter by theme, strength, and liquidity."
  },
  {
    title: "How does FAST mode work?",
    content:
      "FAST mode prioritizes high-conviction dislocations so urgent alerts hit your feed first."
  },
  {
    title: "Can I cancel anytime?",
    content: "Yes. You can manage or cancel your subscription in the billing portal."
  }
];

export default function Faq() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="space-y-4">
        <MagicBadge>FAQ</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">Answers before you start</h2>
        <p className="text-sm text-slate">
          Get clarity on analytics-only alerts, Telegram delivery, and plan controls.
        </p>
        <Link
          href="/faq"
          className="text-sm text-slate underline decoration-accent decoration-2 underline-offset-4"
        >
          Read the full FAQ
        </Link>
      </div>
      <MagicCard>
        <MagicAccordion items={faqItems} />
      </MagicCard>
    </section>
  );
}
