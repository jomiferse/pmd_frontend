import type { ReactNode } from "react";

type AnimatedGradientTextProps = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedGradientText({ children, className = "" }: AnimatedGradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-accent via-warning to-accent bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient ${className}`}
    >
      {children}
    </span>
  );
}
