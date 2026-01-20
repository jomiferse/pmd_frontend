import type { ReactNode } from "react";

type NoticeTone = "info" | "warning" | "error" | "success";

const toneStyles: Record<NoticeTone, string> = {
  info: "border-ink/10 bg-white/80 text-slate",
  warning: "border-warning/40 bg-warning/15 text-ink",
  error: "border-danger/30 bg-danger/10 text-danger",
  success: "border-accent/40 bg-accent/20 text-ink"
};

type NoticeProps = {
  children: ReactNode;
  tone?: NoticeTone;
  className?: string;
};

export default function Notice({ children, tone = "info", className = "" }: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-2 text-xs ${toneStyles[tone]} ${className}`}>
      {children}
    </div>
  );
}
