export default function MagicFooter() {
  return (
    <footer className="border-t border-white/40 bg-white/80 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-slate sm:px-6">
        <p className="uppercase tracking-[0.2em] text-ink">PMD Signal Ops</p>
        <p>Read-only analytics and signal surfacing for Polymarket data.</p>
        <p>Not financial advice. Markets carry risk. Use responsibly.</p>
      </div>
    </footer>
  );
}
