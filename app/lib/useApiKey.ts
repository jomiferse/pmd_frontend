"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pmd_api_key";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setApiKey(stored || null);
    setReady(true);
  }, []);

  const saveKey = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      window.localStorage.removeItem(STORAGE_KEY);
      setApiKey(null);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    setApiKey(trimmed);
  };

  const clearKey = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  };

  return { apiKey, saveKey, clearKey, ready };
}
