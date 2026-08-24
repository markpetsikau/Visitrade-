"use client";

import { useState, useMemo } from "react";
import type { Asset, AssetClass } from "@/lib/types";
import { AssetTable } from "@/components/app/AssetTable";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const tabs: { label: string; value: AssetClass | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "Crypto", value: "crypto" },
  { label: "Indices", value: "index" },
  { label: "Matières premières", value: "commodity" },
];

export function MarketsFilter({ assets }: { assets: Asset[] }) {
  const [tab, setTab] = useState<AssetClass | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const okClass = tab === "all" || a.class === tab;
      const okQ =
        !q ||
        a.symbol.toLowerCase().includes(q.toLowerCase()) ||
        a.name.toLowerCase().includes(q.toLowerCase());
      return okClass && okQ;
    });
  }, [assets, tab, q]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-raised/50 p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                tab === t.value ? "bg-brand/15 text-brand" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrer…"
            className="h-9 w-full rounded-lg border border-border bg-surface-raised pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
          />
        </div>
      </div>
      {filtered.length > 0 ? (
        <AssetTable assets={filtered} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-ink-muted">
          Aucun actif ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
}
