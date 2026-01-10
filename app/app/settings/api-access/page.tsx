"use client";

import { useState } from "react";
import MagicBadge from "../../../components/magicui/MagicBadge";
import MagicButton from "../../../components/magicui/MagicButton";
import MagicCard from "../../../components/magicui/MagicCard";
import MagicNotice from "../../../components/magicui/MagicNotice";
import { API_BASE_URL } from "../../../lib/api";
import { useApiKey } from "../../../lib/useApiKey";

function maskKey(value: string) {
  if (value.length <= 10) {
    return `${value.slice(0, 2)}••••`;
  }
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

export default function ApiAccessPage() {
  const { apiKey, saveKey, clearKey, ready } = useApiKey();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return null;
  }

  const masked = apiKey ? maskKey(apiKey) : "Not set";

  return (
    <section className="space-y-4">
      <MagicCard>
        <MagicBadge>Developer</MagicBadge>
        <h2 className="mt-3 text-2xl font-semibold text-ink">API Access</h2>
        <p className="mt-2 text-sm text-slate">
          You do NOT need an API key to use the PMD dashboard. API keys are for integrations and scripts.
        </p>
      </MagicCard>

      <MagicNotice tone="info">
        Your API key is stored locally in this browser. Share it only with trusted tools.
      </MagicNotice>

      <MagicCard>
        <p className="text-xs uppercase tracking-[0.2em] text-slate">Current API key</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate/20 bg-white px-4 py-2 text-sm text-ink">
            {masked}
          </span>
          <MagicButton
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!apiKey) return;
              await navigator.clipboard.writeText(apiKey);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            disabled={!apiKey}
          >
            {copied ? "Copied" : "Copy"}
          </MagicButton>
          <MagicButton variant="ghost" size="sm" onClick={clearKey} disabled={!apiKey}>
            Clear
          </MagicButton>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate">Set or update key</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste API key"
              className="w-64 rounded-full border border-slate/20 px-4 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
            <MagicButton
              onClick={() => {
                saveKey(draft);
                setDraft("");
              }}
              disabled={!draft.trim()}
            >
              Save
            </MagicButton>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate">Regenerate or revoke</p>
          <p className="mt-2 text-sm text-slate">
            For now, regeneration and revocation are handled through the admin console.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <MagicButton variant="secondary" size="sm" disabled>
              Regenerate
            </MagicButton>
            <MagicButton variant="secondary" size="sm" disabled>
              Revoke
            </MagicButton>
          </div>
        </div>
      </MagicCard>

      <MagicCard>
        <p className="text-xs uppercase tracking-[0.2em] text-slate">API base URL</p>
        <p className="mt-2 text-sm text-ink">{API_BASE_URL}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate">Sample request</p>
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-ink px-4 py-3 text-xs text-white">
          {`curl -H "X-API-Key: <your_key>" ${API_BASE_URL}/alerts/latest`}
        </pre>
      </MagicCard>
    </section>
  );
}
