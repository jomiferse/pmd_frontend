"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasActiveSubscription } from "../lib/session";
import { useSession } from "../lib/useSession";

export default function AppGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!data?.user) {
      router.replace("/login");
      return;
    }
    if (!hasActiveSubscription(data.subscription) && pathname !== "/app/billing") {
      router.replace("/app/billing");
    }
  }, [data, loading, pathname, router]);

  if (loading) {
    return <>{children}</>;
  }

  return data?.user ? <>{children}</> : null;
}
