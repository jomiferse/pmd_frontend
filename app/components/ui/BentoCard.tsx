import type { ReactNode } from "react";

type BentoCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ReactNode;
  className?: string;
};

export default function BentoCard({
  title,
  description,
  eyebrow,
  icon,
  className = ""
}: BentoCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card ${className}`}
    >
      <div className="pointer-events-none absolute -right-12 top-0 h-24 w-24 rounded-full bg-accent/30 blur-2xl transition group-hover:opacity-80" />
      <div className="relative z-10">
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.2em] text-slate">{eyebrow}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          {icon && (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white">
              {icon}
            </span>
          )}
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <p className="mt-3 text-sm text-slate">{description}</p>
      </div>
    </div>
  );
}
