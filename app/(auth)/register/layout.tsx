import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Create your PMD account",
  description: "Start PMD to receive Polymarket alerts and analytics in minutes.",
  path: "/register",
  noIndex: true
});

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
