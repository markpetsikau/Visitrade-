"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS, type FaqItem } from "@/lib/faq";

export { FAQ_ITEMS, type FaqItem };

export function FaqList({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface-raised/40">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-ink">{item.q}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-ink-muted transition-transform",
                open === i && "rotate-180",
              )}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-5 pr-10">
              <p className="text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
