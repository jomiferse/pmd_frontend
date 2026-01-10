import Link from "next/link";
import AnimatedGradientText from "../components/magicui/AnimatedGradientText";
import BentoCard from "../components/magicui/BentoCard";
import BentoGrid from "../components/magicui/BentoGrid";
import MagicAccordion from "../components/magicui/MagicAccordion";
import MagicBadge from "../components/magicui/MagicBadge";
import MagicButton from "../components/magicui/MagicButton";
import MagicCard from "../components/magicui/MagicCard";
import Marquee from "../components/magicui/Marquee";
import Spotlight from "../components/magicui/Spotlight";

const steps = [
  {
    title: "Create account",
    detail: "Start in minutes with email + password."
  },
  {
    title: "Choose a plan",
    detail: "Pick a cadence that matches your monitoring needs."
  },
  {
    title: "Link Telegram",
    detail: "Connect your chat in one tap."
  },
  {
    title: "Receive alerts",
    detail: "Get dislocations and context as they happen."
  }
];

const marqueeItems = [
  "Liquidity vacuum detected",
  "Copilot auto-skipped 14 alerts",
  "FAST mode high-conviction alert",
  "Digest window tuned to 30m",
  "Theme confidence lifted +2.8%"
];

const faqPreview = [
  {
    title: "Does PMD place trades?",
    content: "No. PMD is read-only analytics and alerting. It never places orders."
  },
  {
    title: "How do Telegram alerts work?",
    content: "After linking Telegram, PMD sends alerts and digests based on your plan and filters."
  },
  {
    title: "Can I cancel anytime?",
    content: "Yes. Manage or cancel your subscription in the billing portal."
  }
];

export default function MarketingHome() {
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-card backdrop-blur sm:p-12">
        <Spotlight className="-left-24 -top-24 opacity-70" size={520} />
        <Spotlight className="bottom-0 right-0 opacity-60" color="rgba(255, 179, 71, 0.35)" size={420} />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <MagicBadge>Polymarket dislocations</MagicBadge>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              PMD spots <AnimatedGradientText>market dislocations</AnimatedGradientText> early and
              pipes the signal to you.
            </h1>
            <p className="text-base text-slate sm:text-lg">
              PMD ingests Polymarket data, detects abnormal moves, and sends personalized Telegram
              alerts so you can react before the crowd.
            </p>
            <div className="flex flex-wrap gap-3">
              <MagicButton href="/register" size="lg">
                Get started
              </MagicButton>
              <MagicButton href="/pricing" variant="secondary" size="lg">
                View pricing
              </MagicButton>
            </div>
            <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-slate">
              <span>Realtime ingest</span>
              <span>Per-user filters</span>
              <span>Telegram delivery</span>
            </div>
          </div>
          <div className="grid gap-4">
            <MagicCard className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.2em] text-slate">Signal preview</p>
              <h2 className="mt-3 text-lg font-semibold text-ink">
                "Fed cuts odds shift +3.1% in 12m"
              </h2>
              <p className="mt-2 text-sm text-slate">
                PMD flagged a sudden liquidity vacuum and pushed a Telegram alert.
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
                "Skipped 14 alerts (low liquidity). Sent 3 alerts with high conviction + momentum."
              </p>
              <div className="mt-4 inline-flex items-center rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs text-ink">
                Model confidence +88%
              </div>
            </MagicCard>
          </div>
        </div>
        <div className="relative z-10 mt-8">
          <Marquee
            items={marqueeItems.map((item) => (
              <div
                key={item}
                className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate"
              >
                {item}
              </div>
            ))}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 text-center">
          <MagicBadge>Feature highlights</MagicBadge>
          <h2 className="text-3xl font-semibold text-ink">Signal ops that feel like a copilot</h2>
          <p className="text-sm text-slate">
            Everything you need to detect, explain, and deliver dislocations at speed.
          </p>
        </div>
        <BentoGrid>
          <BentoCard
            eyebrow="Pipeline"
            title="Realtime ingest"
            description="PMD monitors Polymarket pricing changes and surfaces sudden dislocations within minutes."
          />
          <BentoCard
            eyebrow="Filters"
            title="Per-user gating"
            description="Tune strengths, themes, and caps to keep noise low without missing momentum."
          />
          <BentoCard
            eyebrow="Copilot"
            title="Explainable skips"
            description="Copilot notes explain why alerts were skipped so you can adjust filters confidently."
          />
          <BentoCard
            eyebrow="Delivery"
            title="Telegram first"
            description="Instant mobile alerts and digest summaries land where you already trade."
          />
          <BentoCard
            eyebrow="Priority"
            title="FAST mode"
            description="Highlight high-conviction moves with a dedicated lane for urgent alerts."
          />
          <BentoCard
            eyebrow="Insights"
            title="Alert context"
            description="Each alert includes price move, liquidity, and filtering context to support action."
          />
        </BentoGrid>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <MagicCard>
          <h3 className="text-xl font-semibold text-ink">How it works</h3>
          <div className="mt-6 grid gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-sm font-semibold text-ink">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-sm text-slate">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </MagicCard>
        <div className="space-y-4">
          <MagicCard>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Live credibility</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-2xl font-semibold text-ink">2-5 min</p>
                <p className="text-sm text-slate">Typical ingest lag</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">Multi-channel</p>
                <p className="text-sm text-slate">Alerts + digest summaries</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">Smart caps</p>
                <p className="text-sm text-slate">Throttle alerts per user</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">Explainable</p>
                <p className="text-sm text-slate">Skip reasons surfaced</p>
              </div>
            </div>
          </MagicCard>
          <MagicCard>
            <h4 className="text-lg font-semibold text-ink">Ready for the edge?</h4>
            <p className="mt-2 text-sm text-slate">
              Start a plan, connect Telegram, and let PMD watch the tape.
            </p>
            <div className="mt-4">
              <MagicButton href="/pricing">See plans</MagicButton>
            </div>
          </MagicCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <MagicCard>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-ink">FAQ</h3>
            <Link
              href="/faq"
              className="text-xs uppercase tracking-[0.2em] text-slate underline decoration-accent decoration-2 underline-offset-4"
            >
              Full FAQ
            </Link>
          </div>
          <div className="mt-5">
            <MagicAccordion items={faqPreview} />
          </div>
        </MagicCard>
        <MagicCard>
          <h3 className="text-2xl font-semibold text-ink">Pricing that scales with attention</h3>
          <p className="mt-3 text-sm text-slate">
            Choose a monthly plan and tune digest windows, themes, and Copilot behavior.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MagicButton href="/pricing" size="lg">
              View pricing
            </MagicButton>
            <Link
              href="/faq"
              className="text-sm text-slate underline decoration-accent decoration-2 underline-offset-4"
            >
              Read the FAQ
            </Link>
          </div>
        </MagicCard>
      </section>
    </div>
  );
}
