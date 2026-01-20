import type { CSSProperties, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
