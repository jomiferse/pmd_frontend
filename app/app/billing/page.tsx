"use client";

import { useState } from "react";
import { useSearchParam } from "../../lib/useSearchParam";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { createCheckoutSession, createPortalSession } from "../../lib/billing";
import { plans } from "../../lib/plans";
import { hasActiveSubscription } from "../../lib/session";
import { useSession } from "../../lib/useSession";

function formatBillingDate(value: string | null | undefined) {
  if (!value) return null;
  const numeric = Number(value);
  let date: Date;
  if (!Number.isNaN(numeric) && numeric > 0) {
    const ms = numeric < 100000000000 ? numeric * 1000 : numeric;
    date = new Date(ms);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatStatusLabel(status: string) {
  if (!status) return "Inactive";
  const normalized = status.replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function BillingPage() {
  const { data, loading, error: sessionError } = useSession();
  const planIntent = useSearchParam("plan");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscription = data?.subscription ?? null;
  const status = subscription?.status || "inactive";
  const active = hasActiveSubscription(subscription);
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const formattedPeriodEnd = formatBillingDate(subscription?.current_period_end);
  const showPaymentFix = ["past_due", "incomplete", "unpaid"].includes(status);
  const currentPlan = plans.find((plan) => plan.id === subscription?.plan_id) || null;

  const startCheckout = async (planId: (typeof plans)[number]["id"]) => {
    setError(null);
    setProcessing(planId);
    try {
      const url = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setProcessing(null);
    }
  };

  const handlePlanAction = async (planId: (typeof plans)[number]["id"]) => {
    if (processing) return;
    if (active) {
      await openPortal();
      return;
    }
    await startCheckout(planId);
  };

  const openPortal = async () => {
    setError(null);
    setProcessing("portal");
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open portal");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <MagicSkeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <MagicSkeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statusMessage = active
    ? "Your subscription is active."
    : status === "past_due"
      ? "Your payment is past due. Please update your billing method."
      : status === "incomplete"
        ? "Your subscription is incomplete. Please complete payment."
        : status === "canceled"
          ? "Your subscription is canceled."
          : "You need an active subscription to access the control panel.";

  const renewalText = formattedPeriodEnd
    ? cancelAtPeriodEnd
      ? `Cancels on ${formattedPeriodEnd}`
      : `Renews on ${formattedPeriodEnd}`
    : "Not scheduled";

  return (
    <section className="space-y-6">
      {sessionError && (
        <MagicNotice tone="error">Session error: {sessionError}</MagicNotice>
      )}
      {showPaymentFix && (
        <MagicNotice tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Payment needs attention. Update your payment method to restore service.</span>
            <MagicButton
              size="sm"
              variant="secondary"
              onClick={openPortal}
              disabled={processing === "portal"}
            >
              {processing === "portal" ? "Opening portal..." : "Fix payment"}
            </MagicButton>
          </div>
        </MagicNotice>
      )}
      <MagicCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <MagicBadge>Billing</MagicBadge>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Subscription status</h2>
            <p className="mt-2 text-sm text-slate">{statusMessage}</p>
          </div>
          {active && (
            <MagicButton
              variant="secondary"
              onClick={openPortal}
              disabled={processing === "portal"}
            >
              {processing === "portal" ? "Opening portal..." : "Manage subscription"}
            </MagicButton>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Current plan</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {currentPlan?.name || subscription?.plan_name || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Status</p>
            <p className="mt-2 text-sm text-ink">{formatStatusLabel(status)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Renewal date</p>
            <p className="mt-2 text-sm text-ink">{renewalText}</p>
          </div>
        </div>
        {active && !formattedPeriodEnd && (
          <div className="mt-4">
            <MagicNotice tone="warning">
              Renewal date is not available yet. If this persists, refresh or contact support.
            </MagicNotice>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <MagicNotice tone="error">{error}</MagicNotice>
          </div>
        )}
      </MagicCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <MagicCard key={plan.id} className={planIntent === plan.id ? "border border-accent/70" : ""}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{plan.name}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{plan.price}</p>
            <p className="mt-2 text-sm text-slate">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate">
              <li>Digest window: {plan.entitlements.digest_window}</li>
              <li>Themes per digest: {plan.entitlements.max_themes}</li>
              <li>Strengths: {plan.entitlements.strengths}</li>
              <li>Copilot: {plan.entitlements.copilot}</li>
              <li>FAST mode: {plan.entitlements.fast_mode}</li>
            </ul>
            <div className="mt-6">
              {(() => {
                const isCurrentPlan = active && subscription?.plan_id === plan.id;
                const isProcessing =
                  processing === plan.id || (processing === "portal" && active && !isCurrentPlan);
                const label = isCurrentPlan
                  ? "Current plan"
                  : processing === "portal" && active
                    ? "Opening portal..."
                    : processing === plan.id
                      ? "Redirecting..."
                      : active
                        ? "Switch plan"
                        : "Subscribe";
                return (
                  <MagicButton
                    onClick={() => handlePlanAction(plan.id)}
                    disabled={Boolean(processing) || isCurrentPlan}
                  >
                    {label}
                  </MagicButton>
                );
              })()}
            </div>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}
