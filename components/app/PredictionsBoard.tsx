"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, Timer, Activity } from "lucide-react";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { Badge } from "@/components/ui/Badge";
import { useLiveQuote } from "@/components/app/LivePrices";
import {
  HORIZONS,
  hoursLeft,
  probabilityOf,
  type PredictionMarket,
} from "@/lib/predictions/engine";
import { cn } from "@/lib/utils";

const REFRESH_MS = 20_000;

type Filter = "all" | "crypto" | "index" | "commodity";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "crypto", label: "Crypto" },
  { key: "index", label: "Indices" },
  { key: "commodity", label: "Matières premières" },
];

export function PredictionsBoard({
  initialMarkets,
  initialLocked,
  unlimited,
}: {
  initialMarkets: PredictionMarket[];
  initialLocked: number;
  unlimited: boolean;
}) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [locked, setLocked] = useState(initialLocked);
  const [filter, setFilter] = useState<Filter>("all");
  const [horizon, setHorizon] = useState<string>("all");
  const [syncedAt, setSyncedAt] = useState<number>(Date.now());

  // Rafraîchissement serveur : nouveaux seuils, volatilité réévaluée.
  // Entre deux appels, chaque carte recalcule sa probabilité sur les
  // ticks de prix en direct (voir MarketCard).
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.markets)) {
        setMarkets(data.markets);
        setLocked(data.locked ?? 0);
        setSyncedAt(data.generatedAt ?? Date.now());
      }
    } catch {
      /* on garde le board courant */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const shown = useMemo(
    () =>
      markets.filter(
        (m) =>
          (filter === "all" || m.assetClass === filter) &&
          (horizon === "all" || m.horizonKey === horizon),
      ),
    [markets, filter, horizon],
  );

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-brand/40 bg-brand/12 text-brand"
                  : "border-border text-ink-muted hover:bg-surface-hover",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="mx-1 h-4 w-px bg-border" />
        <div className="flex flex-wrap gap-1.5">
          <HorizonChip active={horizon === "all"} onClick={() => setHorizon("all")} label="Tous horizons" />
          {HORIZONS.map((h) => (
            <HorizonChip
              key={h.key}
              active={horizon === h.key}
              onClick={() => setHorizon(h.key)}
              label={h.label}
            />
          ))}
        </div>
        <span className="ml-auto text-[11px] text-ink-faint">
          Recalculé en continu · seuils resynchronisés <RelativeTime at={syncedAt} />
        </span>
      </div>

      {/* Cartes */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
        {!unlimited && locked > 0 && <LockedCard count={locked} />}
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface-raised/40 p-8 text-center text-sm text-ink-muted">
          Aucune question sur ce filtre pour le moment.
        </p>
      )}
    </div>
  );
}

function HorizonChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand/40 bg-brand/12 text-brand"
          : "border-border text-ink-muted hover:bg-surface-hover",
      )}
    >
      {label}
    </button>
  );
}

// ── Une question ─────────────────────────────────────────────
function MarketCard({ market }: { market: PredictionMarket }) {
  // Prix en direct (WebSocket crypto + sondage HTTP pour le reste).
  const quote = useLiveQuote(market.symbol, { price: market.price, change24h: 0 });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // La probabilité suit le prix : elle est recalculée à chaque tick,
  // avec le temps restant qui s'écoule réellement.
  const probability = probabilityOf(
    quote.price,
    market.strike,
    market.volatility,
    hoursLeft(market.deadline, now),
    market.direction,
  );

  const prev = useRef(probability);
  const [delta, setDelta] = useState(0);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const diff = probability - prev.current;
    if (Math.abs(diff) >= 0.1) {
      setDelta(diff);
      setFlash(diff > 0 ? "up" : "down");
      prev.current = probability;
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [probability]);

  const yes = Math.round(probability);
  const distancePct = ((market.strike - quote.price) / quote.price) * 100;

  return (
    <article className="rounded-2xl border border-border bg-surface-raised/40 p-4 transition-colors hover:border-brand/25">
      <div className="flex items-center gap-2.5">
        <AssetIcon symbol={market.symbol} src={market.image} size={30} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-ink">{market.symbol}</span>
            <Badge tone="muted">{market.horizonLabel}</Badge>
          </div>
          <p className="truncate text-[11px] text-ink-faint">{market.name}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-faint">
          <Timer className="h-3 w-3" />
          <Countdown deadline={market.deadline} now={now} />
        </span>
      </div>

      <h3 className="mt-3 text-sm font-medium leading-snug text-ink">{market.question}</h3>

      {/* Probabilité */}
      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "tnum text-3xl font-bold transition-colors duration-500",
              flash === "up" && "text-bull",
              flash === "down" && "text-bear",
              !flash && "text-ink",
            )}
          >
            {yes}
            <span className="text-lg">%</span>
          </span>
          <span className="text-xs text-ink-muted">de chances</span>
        </div>
        {Math.abs(delta) >= 0.1 && (
          <span
            className={cn(
              "tnum text-xs font-medium",
              delta > 0 ? "text-bull" : "text-bear",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} pt
          </span>
        )}
      </div>

      {/* Barre Oui / Non */}
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="bg-brand transition-[width] duration-700 ease-out"
          style={{ width: `${yes}%` }}
        />
        <div className="flex-1 bg-ink-faint/20" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px]">
        <span className="font-medium text-brand">Oui {yes}%</span>
        <span className="text-ink-muted">Non {100 - yes}%</span>
      </div>

      {/* Détail du calcul */}
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-2.5 text-[11px]">
        <div>
          <dt className="text-ink-faint">Cours</dt>
          <dd className="tnum font-medium text-ink">{fmt(quote.price)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Seuil</dt>
          <dd className="tnum font-medium text-ink">
            {fmt(market.strike)}{" "}
            <span className={cn("font-normal", distancePct >= 0 ? "text-bull" : "text-bear")}>
              ({distancePct >= 0 ? "+" : ""}
              {distancePct.toFixed(1)}%)
            </span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-ink-faint">
            <Activity className="h-3 w-3" /> Volatilité
          </dt>
          <dd className="tnum font-medium text-ink">{market.volatility.toFixed(0)}%</dd>
        </div>
      </dl>
    </article>
  );
}

function LockedCard({ count }: { count: number }) {
  return (
    <article className="flex flex-col items-center justify-center rounded-2xl border border-brand/25 bg-brand/[0.05] p-6 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/12 text-brand">
        <Lock className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink">
        {count} autres questions en direct
      </h3>
      <p className="mt-1.5 text-xs text-ink-muted">
        Toutes les probabilités, tous les actifs et tous les horizons sont inclus dans le plan Pro.
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
      >
        <Sparkles className="h-4 w-4" /> Passer au Pro <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

// ── Utilitaires d'affichage ──────────────────────────────────
function fmt(v: number): string {
  const decimals = v >= 100 ? 0 : v >= 10 ? 1 : v >= 1 ? 2 : 4;
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Countdown({ deadline, now }: { deadline: number; now: number }) {
  const ms = Math.max(0, deadline - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (d > 0) return <>{d}j {h}h</>;
  if (h > 0) return <>{h}h {String(m).padStart(2, "0")}m</>;
  return <>{m}m {String(s).padStart(2, "0")}s</>;
}

function RelativeTime({ at }: { at: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.round((Date.now() - at) / 1000));
  return <>il y a {secs < 60 ? `${secs} s` : `${Math.round(secs / 60)} min`}</>;
}
