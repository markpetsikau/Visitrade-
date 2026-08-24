"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Asset } from "@/lib/types";
import { AssetTable } from "@/components/app/AssetTable";
import { EmptyState } from "@/components/app/EmptyState";
import { AssetIcon, classLabelOf } from "@/components/ui/AssetIcon";
import { Button } from "@/components/ui/Button";
import { useMe } from "@/components/app/useMe";
import { WATCHLIST_MAX } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Star, Plus, Check, Minus, Lock } from "lucide-react";

export function WatchlistClient({
  assets,
  initial = [],
}: {
  assets: Asset[];
  initial?: string[];
}) {
  const [watched, setWatched] = useState<string[]>(initial);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const me = useMe();
  const max = WATCHLIST_MAX[me?.plan ?? "free"];
  const capped = Number.isFinite(max);
  const atCap = capped && watched.length >= max;

  // Load saved watchlist (falls back to the onboarding selection).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("visitrade_watchlist");
      if (raw) setWatched(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // Persist changes.
  useEffect(() => {
    if (loaded) localStorage.setItem("visitrade_watchlist", JSON.stringify(watched));
  }, [watched, loaded]);

  // Trim to the plan's limit once the session is known.
  useEffect(() => {
    if (me && Number.isFinite(max) && watched.length > max) {
      setWatched((prev) => prev.slice(0, max));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const assetMap = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.symbol, a])),
    [assets],
  );

  const watchedAssets = useMemo(
    () => watched.map((s) => assetMap[s]).filter(Boolean) as Asset[],
    [watched, assetMap],
  );

  const isWatched = (symbol: string) => watched.includes(symbol);

  const toggle = (symbol: string) => {
    setWatched((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (Number.isFinite(max) && prev.length >= max) return prev; // capped
      return [...prev, symbol];
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <span>
            <span className="tnum font-medium text-ink">{watched.length}</span>
            {capped ? ` / ${max}` : ""}{" "}
            {watched.length > 1 ? "actifs suivis" : "actif suivi"}
          </span>
          {capped && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand"
            >
              <Lock className="h-3 w-3" /> Limité au plan Free · Pro = illimité
            </Link>
          )}
        </p>
        <Button
          variant={pickerOpen ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPickerOpen((v) => !v)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un actif
        </Button>
      </div>

      {pickerOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-surface-raised/40 p-3">
          <div className="mb-2 px-1 text-xs font-medium text-ink-faint">
            Sélectionnez les actifs à suivre
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => {
              const active = isWatched(a.symbol);
              return (
                <button
                  key={a.symbol}
                  onClick={() => toggle(a.symbol)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-brand/40 bg-brand/10"
                      : "border-border bg-surface-raised/50 hover:bg-surface-hover/60",
                  )}
                >
                  <AssetIcon symbol={a.symbol} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {a.symbol}
                    </div>
                    <div className="truncate text-xs text-ink-faint">
                      {a.name} · {classLabelOf(a.class)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                      active
                        ? "border-brand/40 bg-brand/15 text-brand"
                        : "border-border text-ink-muted group-hover:text-ink",
                    )}
                  >
                    {active ? (
                      <>
                        <Check className="h-3.5 w-3.5 group-hover:hidden" />
                        <Minus className="hidden h-3.5 w-3.5 group-hover:block" />
                      </>
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {watchedAssets.length > 0 ? (
        <AssetTable assets={watchedAssets} />
      ) : (
        <EmptyState
          icon={<Star className="h-5 w-5" />}
          title="Votre watchlist est vide"
          description="Ajoutez vos actifs favoris pour suivre leurs signaux et leur évolution en un coup d'œil."
          action={
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter un actif
            </Button>
          }
        />
      )}
    </div>
  );
}
