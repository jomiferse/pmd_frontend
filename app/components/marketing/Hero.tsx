"use client";

import { useState } from "react";
import Link from "next/link";
import AnimatedGradientText from "../magicui/AnimatedGradientText";
import MagicBadge from "../magicui/MagicBadge";
import MagicButton from "../magicui/MagicButton";
import MagicCard from "../magicui/MagicCard";
import Marquee from "../magicui/Marquee";
import Spotlight from "../magicui/Spotlight";

const activityItems = [
  "New dislocation detected: +11% in 60m",
  "Polymarket alerts: liquidity vacuum flagged",
  "Prediction market signals: momentum spike",
  "Market dislocation alerts: FAST lane fired",
  "Polymarket monitoring: digest window 30m"
];

const demoAlerts = [
  {
    title: "Election odds repriced +4.2% in 18m",
    detail: "Low-liquidity spike flagged with momentum confirmation.",
    tags: ["FAST mode", "Liquidity delta"]
  },
  {
    title: "Macro theme widened +2.1% in 9m",
    detail: "PMD flagged a volume surge and tightened digest priority.",
    tags: ["Copilot", "Theme strength"]
  },
  {
    title: "Sports market drift +1.6% in 7m",
    detail: "Filtered to your watchlist with cap controls applied.",
    tags: ["Watchlist", "Caps on"]
  }
];

export default function Hero() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-8 shadow-card backdrop-blur sm:p-12">
      <Spotlight className="-left-28 -top-24 opacity-70" size={520} />
      <Spotlight
        className="bottom-[-40px] right-[-40px] opacity-60"
        color="rgba(255, 179, 71, 0.35)"
        size={420}
      />
      <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <MagicBadge>Polymarket alerts</MagicBadge>
          <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            The move happens fast - <AnimatedGradientText>PMD spots it sooner.</AnimatedGradientText>
          </h1>
          <p className="text-base text-slate sm:text-lg">
            PMD is a read-only analytics layer that scans Polymarket, flags market dislocation
            alerts, and delivers prediction market signals to Telegram. Analytics only. Not
            financial advice.
          </p>
          <div className="flex flex-wrap gap-3">
            <MagicButton href="/register" size="lg">
              Start free
            </MagicButton>
            <MagicButton onClick={() => setIsOpen(true)} variant="secondary" size="lg">
              See sample alerts
            </MagicButton>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold text-slate transition hover:border-ink/10 hover:bg-white/70"
            >
              How it works
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-slate">
            <span>Analytics only</span>
            <span>Not financial advice</span>
            <span>Cancel anytime</span>
          </div>
        </div>

        <div className="grid gap-4">
          <MagicCard className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Live preview</p>
            <h2 className="mt-3 text-lg font-semibold text-ink">
              "Dislocation detected: +3.1% in 12m"
            </h2>
            <p className="mt-2 text-sm text-slate">
              PMD flagged a sudden repricing and pushed a Telegram alert with context.
            </p>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="rounded-full bg-ink px-3 py-1 text-white">FAST mode</span>
              <span className="rounded-full border border-slate/30 px-3 py-1 text-slate">
                Digest 30m
              </span>
            </div>
          </MagicCard>
          <MagicCard className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Copilot notes</p>
            <p className="mt-3 text-sm text-slate">
              "Skipped 14 alerts (low liquidity). Sent 3 high-conviction signals with momentum."
            </p>
            <div className="mt-4 inline-flex items-center rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs text-ink">
              Confidence +88%
            </div>
          </MagicCard>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <Marquee
          items={activityItems.map((item) => (
            <div
              key={item}
              className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate"
            >
              {item}
            </div>
          ))}
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-3xl border border-white/80 bg-white p-6 shadow-card sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate">Demo alerts</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  Sample alert cards (static)
                </h3>
                <p className="mt-2 text-sm text-slate">
                  These examples show the format and context PMD sends. Analytics only.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-ink/10 px-3 py-1 text-sm text-slate hover:border-ink/30"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              {demoAlerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-soft"
                >
                  <p className="text-sm font-semibold text-ink">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate">{alert.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-slate">
                    {alert.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate/20 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <MagicButton href="/register">Create account</MagicButton>
              <MagicButton href="/pricing" variant="secondary">
                See plans
              </MagicButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
