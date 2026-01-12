import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

const features = [
  {
    title: "Dislocation alerts",
    description:
      "Flag sudden repricings with context across Polymarket contracts and watchlists."
  },
  {
    title: "FAST mode monitoring",
    description:
      "A dedicated lane for high-conviction moves so the fastest signals break through."
  },
  {
    title: "Copilot recommendations",
    description:
      "Copilot explains skips and helps you calibrate filters without digging into raw data."
  },
  {
    title: "Telegram delivery",
    description: "Instant alerts and digests land where you already watch the tape."
  },
  {
    title: "Plan-based controls",
    description:
      "Tune digest cadence, theme limits, and caps to keep alerts useful instead of noisy."
  },
  {
    title: "Signal context",
    description:
      "Every alert includes move size, liquidity, and momentum to support fast decisions."
  }
];

export default function Features() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 text-center">
        <MagicBadge>Feature stack</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">Signal ops built for speed</h2>
        <p className="text-sm text-slate">
          Stop refreshing. Start monitoring with Polymarket alerts that stay readable.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <MagicCard key={feature.title} className="space-y-3">
            <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
            <p className="text-sm text-slate">{feature.description}</p>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}
