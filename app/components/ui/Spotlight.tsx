import type { CSSProperties } from "react";

type SpotlightProps = {
  className?: string;
  color?: string;
  size?: number;
  style?: CSSProperties;
};

export default function Spotlight({
  className = "",
  color = "rgba(185, 242, 124, 0.45)",
  size = 420,
  style
}: SpotlightProps) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, rgba(255, 255, 255, 0) 70%)`,
        ...style
      }}
    />
  );
}
