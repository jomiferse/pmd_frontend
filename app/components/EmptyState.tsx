"use client";

import MagicCard from "./magicui/MagicCard";

export default function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <MagicCard className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/30 text-lg font-semibold text-ink">
        0
      </div>
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="mt-2 text-sm text-slate">{detail}</p>
      </div>
    </MagicCard>
  );
}
