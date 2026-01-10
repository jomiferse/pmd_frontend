import type { ReactNode } from "react";

type MagicBadgeProps = {
  children: ReactNode;
};

export default function MagicBadge({ children }: MagicBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate">
      {children}
    </span>
  );
}
