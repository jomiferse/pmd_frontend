"use client";

import { useState } from "react";
import { API_BASE_URL } from "../lib/api";
import { useApiKey } from "../lib/useApiKey";

export default function ApiKeyBar() {
  const { apiKey, saveKey, clearKey, ready } = useApiKey();
  const [draft, setDraft] = useState("");

  if (!ready) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate/20 bg-white px-3 py-2 text-xs text-slate shadow-soft">
      <span className="rounded-full bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white">
        API
      </span>
      <span className="hidden text-[11px] text-slate sm:block">{API_BASE_URL}</span>
      {apiKey ? (
        <>
          <span className="text-[11px] text-ink">key loaded</span>
          <button
            type="button"
            onClick={clearKey}
            className="rounded-full border border-slate/20 px-2 py-1 text-[11px] transition hover:border-ink hover:text-ink"
          >
            Clear
          </button>
        </>
      ) : (
        <>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste API key"
            className="w-40 rounded-full border border-slate/20 px-3 py-1 text-[11px] text-ink focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              saveKey(draft);
              setDraft("");
            }}
            className="rounded-full border border-ink bg-ink px-3 py-1 text-[11px] text-white transition hover:opacity-80"
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
