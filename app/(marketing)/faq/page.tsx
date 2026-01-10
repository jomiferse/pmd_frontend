import MagicAccordion from "../../components/magicui/MagicAccordion";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicCard from "../../components/magicui/MagicCard";
import Spotlight from "../../components/magicui/Spotlight";

const faqItems = [
  {
    title: "What is PMD?",
    content:
      "PMD (Polymarket Dislocation Monitor) ingests market data, detects dislocations, and sends context-rich alerts to your Telegram."
  },
  {
    title: "Does PMD place orders?",
    content: "No. PMD is read-only analytics and alerting. It never places trades."
  },
  {
    title: "How do Telegram alerts work?",
    content:
      "After you link your Telegram account, PMD sends alerts and digests based on your plan and filters."
  },
  {
    title: "Why do I sometimes see \"skipped\"?",
    content:
      "Copilot and caps filter alerts to keep noise low. Skipped reasons help you understand what was filtered."
  },
  {
    title: "Can I cancel anytime?",
    content: "Yes. Manage or cancel your subscription in the billing portal."
  },
  {
    title: "What is the refund policy?",
    content: "Refunds are reviewed case by case. Reach out if you need help."
  }
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-card backdrop-blur">
        <Spotlight className="-left-20 -top-20 opacity-70" size={360} />
        <div className="relative z-10 space-y-3">
          <MagicBadge>FAQ</MagicBadge>
          <h1 className="text-3xl font-semibold text-ink">Answers before you start</h1>
          <p className="text-sm text-slate">Everything you need to know about PMD.</p>
        </div>
      </div>
      <MagicCard>
        <MagicAccordion items={faqItems} />
      </MagicCard>
    </div>
  );
}
