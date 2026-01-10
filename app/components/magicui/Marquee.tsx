import type { ReactNode } from "react";

type MarqueeProps = {
  items: ReactNode[];
  className?: string;
  duration?: number;
  pauseOnHover?: boolean;
};

export default function Marquee({
  items,
  className = "",
  duration = 22,
  pauseOnHover = true
}: MarqueeProps) {
  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
      }}
    >
      <div
        className={`flex w-max gap-4 py-1 ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""} animate-marquee`}
        style={{ ["--duration" as string]: `${duration}s` }}
      >
        {[...items, ...items].map((item, index) => (
          <div key={index} className="shrink-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
