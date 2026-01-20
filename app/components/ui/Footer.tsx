const marketingUrl = (process.env.NEXT_PUBLIC_MARKETING_URL || "https://pmdalerts.com").replace(/\/$/, "");

export default function Footer() {
  return (
    <footer className="border-t border-white/40 bg-white/80 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-xs text-slate sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>PMD Signal Ops</span>
          <span className="text-slate/50">|</span>
          <a href={`${marketingUrl}/privacy`} className="transition hover:text-ink">
            Privacy
          </a>
          <a href={`${marketingUrl}/cookies`} className="transition hover:text-ink">
            Cookies
          </a>
          <a href={`${marketingUrl}/legal-advice`} className="transition hover:text-ink">
            Legal advice
          </a>
        </div>
        <p>Read-only analytics and signal surfacing for Polymarket data.</p>
        <p>Not financial advice. Markets carry risk. Use responsibly.</p>
      </div>
    </footer>
  );
}
