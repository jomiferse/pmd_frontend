"use client";

import { useEffect } from "react";
import Link from "next/link";
import MagicButton from "./components/magicui/MagicButton";
import MagicCard from "./components/magicui/MagicCard";
import MagicNotice from "./components/magicui/MagicNotice";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
      <MagicCard className="w-full text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">PMD hit an unexpected error</h1>
        <p className="mt-2 text-sm text-slate">
          Refresh the page or head back to the dashboard. Your data is safe.
        </p>
        <div className="mt-4">
          <MagicNotice tone="error">Error: {error.message}</MagicNotice>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <MagicButton onClick={reset}>Try again</MagicButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate/20 bg-white px-5 py-2 text-sm font-semibold text-slate transition hover:border-ink hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </MagicCard>
    </div>
  );
}
