"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicNotice from "../../components/magicui/MagicNotice";
import Spotlight from "../../components/magicui/Spotlight";
import { createCheckoutSession } from "../../lib/billing";
import { plans } from "../../lib/plans";
import { useSession } from "../../lib/useSession";

export default function PricingPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const featuredPlanId = "pro";

  const handlePlan = async (planId: (typeof plans)[number]["id"]) => {
    setError(null);
    if (sessionLoading) {
      setError("Checking session, please try again.");
      return;
    }
    if (!session?.user) {
      router.push(`/register?plan=${planId}`);
      return;
    }
    setLoadingPlan(planId);
    try {
      const url = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-card backdrop-blur sm:p-10">
        <Spotlight className="-left-20 -top-20 opacity-70" size={360} />
        <div className="relative z-10 space-y-4">
          <MagicBadge>Monthly plans</MagicBadge>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
            Pick the cadence that fits your edge
          </h1>
          <p className="text-sm text-slate">
            Upgrade anytime. Your plan controls digest window, Copilot, and FAST mode.
          </p>
          {error && (
            <MagicNotice tone="error" className="mx-auto max-w-xl">
              {error}
            </MagicNotice>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <MagicCard
            key={plan.id}
            className={`flex h-full flex-col ${plan.id === featuredPlanId ? "border border-accent/70" : ""}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate">{plan.name}</p>
                {plan.id === featuredPlanId && (
                  <span className="rounded-full bg-accent/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink">
                    Most popular
                  </span>
                )}
              </div>
              <p className="text-3xl font-semibold text-ink">{plan.price}</p>
              <p className="text-sm text-slate">{plan.description}</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate">
              <li>Digest window: {plan.entitlements.digest_window}</li>
              <li>Themes per digest: {plan.entitlements.max_themes}</li>
              <li>Strengths: {plan.entitlements.strengths}</li>
              <li>Copilot: {plan.entitlements.copilot}</li>
              <li>FAST mode: {plan.entitlements.fast_mode}</li>
            </ul>
            <div className="mt-8">
              <MagicButton
                onClick={() => handlePlan(plan.id)}
                disabled={Boolean(loadingPlan) || sessionLoading}
                variant={plan.id === featuredPlanId ? "primary" : "secondary"}
              >
                {loadingPlan === plan.id ? "Redirecting..." : plan.cta}
              </MagicButton>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  );
}
