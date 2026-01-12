import type { ReactNode } from "react";
import { createPageMetadata } from "../../lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Login to PMD",
  description: "Access your PMD alerts dashboard and billing portal.",
  path: "/login",
  noIndex: true
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
