import MagicBadge from "../magicui/MagicBadge";
import MagicCard from "../magicui/MagicCard";

export default function ProblemSolution() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="space-y-4">
        <MagicBadge>Problem and solution</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">
          Most people miss the move. PMD doesn't.
        </h2>
        <p className="text-sm text-slate">
          Manual refreshes and noisy feeds hide the exact moment a Polymarket market dislocation
          happens. PMD runs Polymarket monitoring around the clock and pings you the instant a move
          breaks your thresholds.
        </p>
      </div>
      <MagicCard className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate">What changes</p>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink">Before PMD</p>
            <p className="text-sm text-slate">
              You react late and filter noise manually, missing the cleanest dislocations.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">With PMD</p>
            <p className="text-sm text-slate">
              Prediction market signals arrive with context, so you can decide faster without
              guessing.
            </p>
          </div>
        </div>
      </MagicCard>
    </section>
  );
}
