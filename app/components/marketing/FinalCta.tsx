import MagicBadge from "../magicui/MagicBadge";
import MagicButton from "../magicui/MagicButton";
import Spotlight from "../magicui/Spotlight";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-8 text-center shadow-card backdrop-blur sm:p-12">
      <Spotlight className="-left-20 -top-20 opacity-70" size={360} />
      <div className="relative z-10 space-y-4">
        <MagicBadge>Ready to monitor</MagicBadge>
        <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
          Stop refreshing. Start monitoring with PMD.
        </h2>
        <p className="text-sm text-slate">
          Analytics-only Polymarket alerts with clear context and Telegram delivery.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <MagicButton href="/register" size="lg">
            Create account
          </MagicButton>
          <MagicButton href="/pricing" variant="secondary" size="lg">
            See pricing
          </MagicButton>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate">
          Analytics only • Not financial advice • Cancel anytime
        </p>
      </div>
    </section>
  );
}
