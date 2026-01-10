import type { ReactNode } from "react";

type BentoGridProps = {
  children: ReactNode;
  className?: string;
};

export default function BentoGrid({ children, className = "" }: BentoGridProps) {
  return <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>;
}
