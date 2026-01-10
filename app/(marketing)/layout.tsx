import type { ReactNode } from "react";
import MagicFooter from "../components/magicui/MagicFooter";
import MagicNavbar from "../components/magicui/MagicNavbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fog text-ink">
      <MagicNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        {children}
      </main>
      <MagicFooter />
    </div>
  );
}
