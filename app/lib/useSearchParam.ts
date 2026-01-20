"use client";

import { useSearchParams } from "next/navigation";

export function useSearchParam(key: string) {
  const searchParams = useSearchParams();
  return searchParams.get(key);
}
