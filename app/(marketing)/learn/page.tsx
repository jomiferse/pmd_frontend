import MagicBadge from "../../components/magicui/MagicBadge";
import MagicCard from "../../components/magicui/MagicCard";
import { createPageMetadata } from "../../lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Learn PMD Polymarket monitoring",
  description:
    "Learn how PMD delivers Polymarket monitoring, prediction market signals, and market dislocation alerts.",
  path: "/learn"
});

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-card backdrop-blur">
        <MagicBadge>Learn</MagicBadge>
        <h1 className="mt-3 text-3xl font-semibold text-ink">How PMD monitoring works</h1>
        <p className="mt-3 text-sm text-slate">
          Short guides and explainers are coming soon. Until then, explore the FAQ and pricing
          pages to understand plan controls and alert delivery.
        </p>
      </div>
      <MagicCard>
        <h2 className="text-xl font-semibold text-ink">What you can expect</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate">
          <li>Polymarket alert examples and dislocation definitions.</li>
          <li>Signal setup walkthroughs for FAST mode and digests.</li>
          <li>Best practices for clean prediction market signals.</li>
        </ul>
      </MagicCard>
    </div>
  );
}
