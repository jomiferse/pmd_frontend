import Link from "next/link";
import MagicBadge from "../magicui/MagicBadge";
import MagicButton from "../magicui/MagicButton";
import MagicCard from "../magicui/MagicCard";
import { plans } from "../../lib/plans";

export default function PricingTeaser() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 text-center">
        <MagicBadge>Pricing</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink">Plans that scale with attention</h2>
        <p className="text-sm text-slate">
          Upgrade anytime. Analytics-only monitoring with plan-based controls.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <MagicCard key={plan.id} className="flex h-full flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate">{plan.name}</p>
              <p className="text-3xl font-semibold text-ink">{plan.price}</p>
              <p className="text-sm text-slate">{plan.description}</p>
            </div>
            <div className="mt-6 space-y-2 text-sm text-slate">
              <p>Digest window: {plan.entitlements.digest_window}</p>
              <p>Copilot: {plan.entitlements.copilot}</p>
              <p>FAST mode: {plan.entitlements.fast_mode}</p>
            </div>
            <div className="mt-6">
              <MagicButton href="/pricing" variant="secondary">
                View full pricing
              </MagicButton>
            </div>
          </MagicCard>
        ))}
      </div>
      <div className="text-center text-sm text-slate">
        <p className="text-xs uppercase tracking-[0.2em] text-slate">Upgrade anytime</p>
        <Link
          href="/pricing"
          className="mt-2 inline-flex text-sm text-slate underline decoration-accent decoration-2 underline-offset-4"
        >
          Compare all plan details
        </Link>
      </div>
    </section>
  );
}
