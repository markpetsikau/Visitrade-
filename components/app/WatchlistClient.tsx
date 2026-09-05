"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Asset } from "@/lib/types";
import { AssetTable } from "@/components/app/AssetTable";
import { EmptyState } from "@/components/app/EmptyState";
import { AssetIcon, classLabelOf } from "@/components/ui/AssetIcon";
import { Button } from "@/components/ui/Button";
import { LEGACY_KEYS, clearLegacy, readLegacy } from "@/components/app/legacy-storage";
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
  const [max, setMax] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const capped = max !== null;
  const atCap = capped && watched.length >= max;

  // La watchlist appartient au compte : elle est lue sur le serveur, pas
  // dans le navigateur — donc identique sur tous les appareils.
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setMax(typeof data.max === "number" ? data.max : null);

        let symbols: string[] = Array.isArray(data.symbols) ? data.symbols : [];

        // Serveur vide : on reprend ce que le navigateur avait gardé,
        // sinon la sélection faite à l'inscription.
        if (symbols.length === 0) {
          const legacy = readLegacy<string[]>(LEGACY_KEYS.watchlist);
          const seed = legacy?.length ? legacy : initial;
          if (seed.length) {
            const saved = await fetch("/api/watchlist", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ symbols: seed }),
            });
            if (saved.ok) {
              const savedData = await saved.json();
              symbols = savedData.symbols ?? seed;
              if (legacy) clearLegacy(LEGACY_KEYS.watchlist);
            }
          }
        } else {
          // Le serveur fait foi : la copie locale devenue obsolète part.
          clearLegacy(LEGACY_KEYS.watchlist);
        }

        if (alive) setWatched(symbols);
      } catch {
        /* hors ligne : on garde la sélection d'inscription */
      } finally {
        if (alive) setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enregistrement groupé : cocher cinq actifs d'affilée = un seul appel.
  const persist = useCallback((next: string[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: next }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          // Le serveur applique le plafond du plan : on s'aligne dessus.
          if (d && Array.isArray(d.symbols)) setWatched(d.symbols);
        })
        .catch(() => {
          /* on garde l'état affiché ; la prochaine action réessaiera */
        });
    }, 400);
  }, []);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

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
      let next: string[];
      if (prev.includes(symbol)) {
        next = prev.filter((s) => s !== symbol);
      } else {
        if (max !== null && prev.length >= max) return prev; // plafond atteint
        next = [...prev, symbol];
      }
      persist(next);
      return next;
    });
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-raised/40" />;
  }

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
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-ink-faint">
              Sélectionnez les actifs à suivre
            </span>
            {atCap && (
              <span className="text-xs text-warn">
                Plafond du plan atteint — retirez un actif pour en ajouter un autre.
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => {
              const active = isWatched(a.symbol);
              const blocked = !active && atCap;
              return (
                <button
                  key={a.symbol}
                  onClick={() => toggle(a.symbol)}
                  disabled={blocked}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-brand/40 bg-brand/10"
                      : "border-border bg-surface-raised/50 hover:bg-surface-hover/60",
                    blocked && "cursor-not-allowed opacity-40 hover:bg-surface-raised/50",
                  )}
                >
                  <AssetIcon symbol={a.symbol} src={a.image} size={30} />
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
