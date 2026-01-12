import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "PMD pricing for Polymarket alerts",
  description:
    "Choose a PMD plan for Polymarket alerts, prediction market signals, and dislocation monitoring.",
  path: "/pricing"
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
