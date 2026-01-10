"use client";

import { useEffect, useState } from "react";
import { apiClient } from "./apiClient";
import type { SessionResponse } from "./session";

export function useSession() {
  const [data, setData] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient
      .get<SessionResponse | { detail?: string }>("/me", {
        credentials: "include",
        cache: "no-store"
      })
      .then((result) => {
        if (!mounted) return;
        if (result.status === 401) {
          setData(null);
          setError(null);
          return;
        }
        if (!result.ok) {
          setData(null);
          setError(result.error || "Failed to load session");
          return;
        }
        setData(result.data && "user" in result.data ? (result.data as SessionResponse) : null);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Session unavailable");
        setData(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
