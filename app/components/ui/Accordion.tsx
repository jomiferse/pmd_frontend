"use client";

import { useState } from "react";

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <button
            key={item.title}
            type="button"
            className="w-full rounded-2xl border border-white/70 bg-white/80 p-5 text-left shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card"
            onClick={() => setOpenIndex(open ? null : index)}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-ink">{item.title}</span>
              <span className="text-lg text-slate">{open ? "-" : "+"}</span>
            </div>
            {open && <p className="mt-3 text-sm text-slate">{item.content}</p>}
          </button>
        );
      })}
    </div>
  );
}
