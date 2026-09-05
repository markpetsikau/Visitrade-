"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Layers, Plus, Trash2, X, Search } from "lucide-react";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { ChangeBadge } from "@/components/ui/Badge";
import { useLive, getQuoteNow } from "@/components/app/LivePrices";
import { LEGACY_KEYS, clearLegacy, readLegacy } from "@/components/app/legacy-storage";
import type { StoredPosition } from "@/lib/data/types";
import { formatPrice, formatPct, cn } from "@/lib/utils";

export interface PickAsset {
  symbol: string;
  name: string;
  image?: string;
  price: number;
}
interface Position {
  symbol: string;
  name: string;
  image?: string;
  qty: number;
  avgPrice: number;
  refPrice: number; // price at add time (fallback if no live quote)
}

const COLORS = ["#00D1B2", "#627EEA", "#F7931A", "#14F195", "#8B5CF6", "#F59E0B", "#EF4444", "#38BDF8"];

const inputClass =
  "h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none";

export function PortfolioClient({ assets }: { assets: PickAsset[] }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  useLive(); // re-render as live prices tick

  const assetMap = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.symbol, a])),
    [assets],
  );

  // Le serveur ne stocke que ce qui est propre à l'utilisateur (symbole,
  // quantité, prix moyen) ; le nom, le logo et le prix de repli viennent
  // des données de marché du moment.
  const hydrate = useCallback(
    (stored: StoredPosition[]): Position[] =>
      stored.map((p) => {
        const a = assetMap[p.symbol];
        return {
          symbol: p.symbol,
          name: a?.name ?? p.symbol,
          image: a?.image,
          qty: p.qty,
          avgPrice: p.avgPrice,
          refPrice: getQuoteNow(p.symbol)?.price ?? a?.price ?? p.avgPrice,
        };
      }),
    [assetMap],
  );

  // Les positions appartiennent au compte : elles suivent l'utilisateur
  // d'un appareil à l'autre au lieu de vivre dans un seul navigateur.
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/positions");
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;

        let stored: StoredPosition[] = Array.isArray(data.positions) ? data.positions : [];

        // Reprise unique de ce qu'un navigateur avait gardé.
        if (stored.length === 0) {
          const legacy = readLegacy<Position[]>(LEGACY_KEYS.portfolio);
          if (legacy?.length) {
            for (const p of legacy) {
              const saved = await fetch("/api/positions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symbol: p.symbol, qty: p.qty, avgPrice: p.avgPrice }),
              });
              if (saved.ok) {
                const d = await saved.json();
                if (Array.isArray(d.positions)) stored = d.positions;
              }
            }
            clearLegacy(LEGACY_KEYS.portfolio);
          }
        } else {
          clearLegacy(LEGACY_KEYS.portfolio);
        }

        if (alive) setPositions(hydrate(stored));
      } catch {
        /* hors ligne : portefeuille vide plutôt qu'une donnée fausse */
      } finally {
        if (alive) setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceOf = (p: Position) => getQuoteNow(p.symbol)?.price ?? p.refPrice;
  const change24Of = (p: Position) => getQuoteNow(p.symbol)?.change24h ?? 0;

  const rows = positions
    .map((p) => {
      const price = priceOf(p);
      const value = p.qty * price;
      const cost = p.qty * p.avgPrice;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      const ch = change24Of(p);
      const pnl24 = value - value / (1 + ch / 100);
      return { ...p, price, value, cost, pnl, pnlPct, pnl24 };
    })
    .sort((a, b) => b.value - a.value);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const total24 = rows.reduce((s, r) => s + r.pnl24, 0);

  const addPosition = async (pos: Position) => {
    // Cumul si le symbole est déjà détenu (prix moyen pondéré).
    const existing = positions.find((p) => p.symbol === pos.symbol);
    const qty = existing ? existing.qty + pos.qty : pos.qty;
    const avgPrice = existing
      ? (existing.qty * existing.avgPrice + pos.qty * pos.avgPrice) / qty
      : pos.avgPrice;

    setShowForm(false);
    // Affichage immédiat, puis confirmation par le serveur.
    setPositions((prev) => {
      const others = prev.filter((p) => p.symbol !== pos.symbol);
      return [...others, { ...pos, qty, avgPrice }];
    });

    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: pos.symbol, qty, avgPrice }),
      });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.positions)) setPositions(hydrate(d.positions));
      }
    } catch {
      /* l'affichage optimiste reste ; le prochain chargement corrigera */
    }
  };

  const remove = async (symbol: string) => {
    setPositions((prev) => prev.filter((p) => p.symbol !== symbol));
    try {
      const res = await fetch(`/api/positions?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.positions)) setPositions(hydrate(d.positions));
      }
    } catch {
      /* idem */
    }
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-raised/40" />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Ajouter une position
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title="Aucune position pour l'instant"
          description="Ajoutez votre première position pour suivre sa valeur, votre P&L et votre allocation en temps réel."
          action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Ajouter une position</Button>}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Valeur totale" value={formatPrice(totalValue)} hint={`Coût ${formatPrice(totalCost)}`} tone="brand" icon={<Wallet className="h-4 w-4" />} />
            <StatCard label="P&L total" value={`${totalPnl >= 0 ? "+" : ""}${formatPrice(totalPnl)}`} hint={formatPct(totalPnlPct)} tone={totalPnl >= 0 ? "bull" : "bear"} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="P&L 24h" value={`${total24 >= 0 ? "+" : ""}${formatPrice(total24)}`} tone={total24 >= 0 ? "bull" : "bear"} />
            <StatCard label="Positions" value={String(rows.length)} icon={<Layers className="h-4 w-4" />} />
          </div>

          {/* Allocation */}
          <div className="mt-4 rounded-2xl border border-border bg-surface-raised/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Allocation</h2>
              <span className="tnum text-sm font-medium text-ink">{formatPrice(totalValue)}</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
              {rows.map((r, i) => (
                <div key={r.symbol} style={{ width: `${(r.value / totalValue) * 100}%`, background: COLORS[i % COLORS.length] }} title={`${r.symbol} · ${((r.value / totalValue) * 100).toFixed(1)}%`} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {rows.map((r, i) => (
                <span key={r.symbol} className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {r.symbol} {((r.value / totalValue) * 100).toFixed(1)}%
                </span>
              ))}
            </div>
          </div>

          {/* Positions table */}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface-raised/40">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-faint">
                  <th className="px-4 py-3 font-medium">Actif</th>
                  <th className="px-4 py-3 text-right font-medium">Quantité</th>
                  <th className="px-4 py-3 text-right font-medium">Prix moyen</th>
                  <th className="px-4 py-3 text-right font-medium">Prix actuel</th>
                  <th className="px-4 py-3 text-right font-medium">Valeur</th>
                  <th className="px-4 py-3 text-right font-medium">P&L</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/markets/${r.symbol}`} className="flex items-center gap-2.5">
                        <AssetIcon symbol={r.symbol} src={r.image} size={28} />
                        <div>
                          <div className="font-medium text-ink">{r.symbol}</div>
                          <div className="text-xs text-ink-faint">{r.name}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-ink-muted">{r.qty}</td>
                    <td className="tnum px-4 py-3 text-right text-ink-muted">{formatPrice(r.avgPrice)}</td>
                    <td className="tnum px-4 py-3 text-right font-medium text-ink">{formatPrice(r.price)}</td>
                    <td className="tnum px-4 py-3 text-right font-medium text-ink">{formatPrice(r.value)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("tnum font-medium", r.pnl >= 0 ? "text-bull" : "text-bear")}>
                          {r.pnl >= 0 ? "+" : ""}{formatPrice(r.pnl)}
                        </span>
                        <ChangeBadge value={r.pnlPct} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(r.symbol)} className="text-ink-faint transition-colors hover:text-bear" aria-label="Retirer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && <AddPositionForm assets={assets} onAdd={addPosition} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AddPositionForm({
  assets,
  onAdd,
  onClose,
}: {
  assets: PickAsset[];
  onAdd: (p: Position) => void | Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PickAsset | null>(null);
  const [qty, setQty] = useState("");
  const [avg, setAvg] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return assets
      .filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [assets, query]);

  const submit = () => {
    if (!selected) return;
    const q = parseFloat(qty);
    const a = parseFloat(avg);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(a) || a <= 0) return;
    onAdd({
      symbol: selected.symbol,
      name: selected.name,
      image: selected.image,
      qty: q,
      avgPrice: a,
      refPrice: getQuoteNow(selected.symbol)?.price ?? selected.price,
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border-strong bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Ajouter une position</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X className="h-4 w-4" /></button>
        </div>

        {/* Asset picker */}
        {selected ? (
          <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-brand/30 bg-brand/[0.06] p-2.5">
            <AssetIcon symbol={selected.symbol} src={selected.image} size={30} />
            <div className="flex-1">
              <div className="text-sm font-medium text-ink">{selected.symbol}</div>
              <div className="text-xs text-ink-faint">{selected.name}</div>
            </div>
            <button onClick={() => { setSelected(null); setQuery(""); }} className="text-xs text-brand hover:underline">Changer</button>
          </div>
        ) : (
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un actif (BTC, ETH…)" className={cn(inputClass, "pl-9")} />
            {matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
                {matches.map((a) => (
                  <button key={a.symbol} onClick={() => { setSelected(a); setAvg(String((getQuoteNow(a.symbol)?.price ?? a.price))); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-hover">
                    <AssetIcon symbol={a.symbol} src={a.image} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink">{a.symbol}</div>
                      <div className="truncate text-xs text-ink-faint">{a.name}</div>
                    </div>
                    <span className="tnum text-xs text-ink-muted">{formatPrice(getQuoteNow(a.symbol)?.price ?? a.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Quantité</span>
            <input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0.5" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Prix d'achat moyen ($)</span>
            <input type="number" step="any" value={avg} onChange={(e) => setAvg(e.target.value)} placeholder="60000" className={inputClass} />
          </label>
        </div>

        <Button size="md" className="mt-4 w-full" onClick={submit}>
          Ajouter au portefeuille
        </Button>
      </div>
    </div>
  );
}
