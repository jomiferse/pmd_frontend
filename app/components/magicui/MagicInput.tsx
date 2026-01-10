import type { InputHTMLAttributes, ReactNode } from "react";

type MagicInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export default function MagicInput({ label, className = "", ...props }: MagicInputProps) {
  return (
    <label className="block text-sm text-slate">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft transition focus-within:border-ink">
        <input
          {...props}
          className={`w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate/50 ${className}`}
        />
      </span>
    </label>
  );
}
