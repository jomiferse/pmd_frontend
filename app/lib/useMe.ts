"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { MeResponse } from "./types";

export function useMe(apiKey: string | null) {
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setData(null);
      setError("Missing API key");
      return;
    }
    let mounted = true;
    setLoading(true);
    apiFetch<MeResponse>("/me", apiKey).then((result) => {
      if (!mounted) return;
      if (!result.ok) {
        setError(result.error || "Failed to load profile");
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [apiKey]);

  return { data, error, loading };
}
