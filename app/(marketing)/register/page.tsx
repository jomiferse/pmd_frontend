"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicInput from "../../components/magicui/MagicInput";
import MagicNotice from "../../components/magicui/MagicNotice";
import { API_BASE_URL, readJson } from "../../lib/api";
import { useSearchParam } from "../../lib/useSearchParam";

export default function RegisterPage() {
  const router = useRouter();
  const planIntent = useSearchParam("plan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const registerPayload = await readJson<{ detail?: string }>(registerResponse);
      if (!registerResponse.ok) {
        throw new Error(registerPayload?.detail || "Registration failed");
      }

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      if (!loginResponse.ok) {
        throw new Error("Login after registration failed");
      }

      router.replace(planIntent ? `/app/billing?plan=${planIntent}` : "/app/billing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <MagicCard>
        <div className="space-y-2 text-center">
          <MagicBadge>Start now</MagicBadge>
          <h1 className="text-2xl font-semibold text-ink">Create your PMD account</h1>
          <p className="text-sm text-slate">Create an account to unlock alerts and billing.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <MagicInput
            label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <MagicInput
            label="Password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <MagicNotice tone="error">
              {error}
            </MagicNotice>
          )}
          <MagicButton type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </MagicButton>
        </form>
      </MagicCard>
      <MagicCard className="flex h-full flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate">What you get</p>
          <h2 className="mt-3 text-xl font-semibold text-ink">Signal ops in minutes</h2>
          <p className="mt-2 text-sm text-slate">
            Choose a plan, connect Telegram, and start receiving dislocation alerts instantly.
          </p>
        </div>
        <div className="mt-6 space-y-2 text-xs text-slate">
          <p className="rounded-full border border-slate/20 px-3 py-2">Plan-based digest cadence</p>
          <p className="rounded-full border border-slate/20 px-3 py-2">Copilot skip reasons</p>
          <p className="rounded-full border border-slate/20 px-3 py-2">Billing portal access</p>
        </div>
      </MagicCard>
    </div>
  );
}
