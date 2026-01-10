"use client";

import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import MagicCard from "../../components/magicui/MagicCard";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { TELEGRAM_BOT_USERNAME } from "../../lib/env";
import { useSession } from "../../lib/useSession";

const BOT_USERNAME = TELEGRAM_BOT_USERNAME;

export default function TelegramPage() {
  const { data: session, loading, error } = useSession();
  const [copied, setCopied] = useState(false);

  if (error) {
    return <EmptyState title="Failed to load status" detail={error} />;
  }

  if (loading || !session?.user) {
    return (
      <div className="space-y-4">
        <MagicSkeleton className="h-20 w-full" />
        <MagicSkeleton className="h-48 w-full" />
      </div>
    );
  }

  const linked = Boolean(session.user.telegram_chat_id);
  const link = session.user.id
    ? `https://t.me/${BOT_USERNAME}?start=pmd_${session.user.id}`
    : null;

  return (
    <section className="space-y-4">
      <MagicCard>
        <h2 className="text-xl font-semibold">Telegram Linking</h2>
        <p className="text-sm text-slate">Connect your chat to receive Copilot updates.</p>
      </MagicCard>

      <MagicCard>
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${linked ? "bg-accent" : "bg-warning"}`}
          />
          <p className="text-sm text-ink">
            Status: {linked ? "Linked" : "Pending"}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-fog p-4 text-sm text-slate">
          {link ? (
            <>
              <p className="text-xs uppercase tracking-[0.2em]">Linking URL</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={link}
                  className="text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    if (!link) return;
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                  className="rounded-full border border-slate/30 px-3 py-1 text-xs text-slate transition hover:border-ink hover:text-ink"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </>
          ) : (
            <p>Link unavailable until user profile exists.</p>
          )}
        </div>

        <div className="mt-4 text-sm text-slate">
          <p className="font-semibold text-ink">How to /start</p>
          <p className="mt-2">
            Open the bot link above or send <code>/start pmd_&lt;your_user_id&gt;</code> in Telegram.
          </p>
        </div>
      </MagicCard>
    </section>
  );
}
