import type { CSSProperties, ReactNode } from "react";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function MagicCard({ children, className = "", style }: MagicCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
