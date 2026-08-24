"use client";

import { useState } from "react";
import type { Asset, AiAnalysis } from "@/lib/types";
import { ScenarioCards } from "@/components/app/ScenarioCards";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { TrendBadge } from "@/components/ui/Badge";
import { cn, formatPrice } from "@/lib/utils";

export function ScenariosClient({
  items,
}: {
  items: { asset: Asset; analysis: AiAnalysis }[];
}) {
  const [active, setActive] = useState(items[0].asset.symbol);
  const current = items.find((i) => i.asset.symbol === active)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      {/* Watched list */}
      <div className="space-y-1.5">
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Scénarios surveillés
        </div>
        {items.map(({ asset, analysis }) => (
          <button
            key={asset.symbol}
            onClick={() => setActive(asset.symbol)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
              active === asset.symbol
                ? "border-brand/40 bg-brand/[0.06]"
                : "border-border bg-surface-raised/40 hover:bg-surface-hover/50",
            )}
          >
            <AssetIcon symbol={asset.symbol} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">{asset.symbol}</div>
              <div className="tnum text-xs text-ink-faint">{formatPrice(asset.price)}</div>
            </div>
            <TrendBadge trend={analysis.trend.direction} />
          </button>
        ))}
      </div>

      {/* Scenarios for active */}
      <div>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-raised/40 p-4">
          <AssetIcon symbol={current.asset.symbol} size={38} />
          <div className="flex-1">
            <div className="font-semibold text-ink">
              {current.asset.symbol} · {current.asset.name}
            </div>
            <p className="text-xs text-ink-muted">{current.analysis.summary}</p>
          </div>
        </div>
        <ScenarioCards scenarios={current.analysis.scenarios} />
      </div>
    </div>
  );
}
