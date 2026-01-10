type MagicSkeletonProps = {
  className?: string;
};

export default function MagicSkeleton({ className = "" }: MagicSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate/10 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.6),transparent)]" />
    </div>
  );
}
