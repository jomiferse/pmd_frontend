"use client";

import { useEffect, useState } from "react";

export function useSearchParam(key: string) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
  }, [key]);

  return value;
}
