import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

const steps = [
  {
    title: "Connect",
    detail: "Create your account and choose a plan that matches your cadence."
  },
  {
    title: "Set thresholds",
    detail: "Tune liquidity, volume, move size, and FAST mode monitoring."
  },
  {
    title: "Receive signal",
    detail: "Get real-time alerts, digest summaries, and a dashboard for review."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="space-y-6">
      <div className="flex flex-col gap-3 text-center">
        <MagicBadge>How it works</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">Three steps to never miss the spike</h2>
        <p className="text-sm text-slate">
          Your watchlist, but with signal — analytics only, not financial advice.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {steps.map((step, index) => (
          <MagicCard key={step.title} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-sm font-semibold text-ink">
                {index + 1}
              </div>
              <p className="text-base font-semibold text-ink">{step.title}</p>
            </div>
            <p className="text-sm text-slate">{step.detail}</p>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}
