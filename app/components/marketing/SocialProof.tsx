import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

const stats = [
  {
    label: "Markets monitored",
    value: "300+",
    caption: "Demo telemetry"
  },
  {
    label: "Signals processed",
    value: "12k",
    caption: "Demo telemetry"
  },
  {
    label: "Alert delivery",
    value: "< 60s",
    caption: "Demo telemetry"
  }
];

export default function SocialProof() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 text-center">
        <MagicBadge>Built for power users</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">
          Operator-grade monitoring for Polymarket
        </h2>
        <p className="text-sm text-slate">
          Designed for analysts who need clean prediction market signals, not noisy feeds.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <MagicCard key={stat.label} className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-2 text-xs text-slate">{stat.caption}</p>
          </MagicCard>
        ))}
      </div>
      <p className="text-center text-xs uppercase tracking-[0.2em] text-slate">
        Demo telemetry for preview only, not live production metrics.
      </p>
    </section>
  );
}
