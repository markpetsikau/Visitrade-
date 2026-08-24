"use client";

import { useState, useMemo } from "react";
import type { Asset } from "@/lib/types";
import { AssetTable } from "@/components/app/AssetTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Radar, RotateCcw } from "lucide-react";

type Trend = "any" | "bullish" | "bearish";

export function ScannerClient({ assets }: { assets: Asset[] }) {
  const [trend, setTrend] = useState<Trend>("any");
  const [minMomentum, setMinMomentum] = useState(-100);
  const [maxVol, setMaxVol] = useState(100);
  const [minRsi, setMinRsi] = useState(0);
  const [maxRsi, setMaxRsi] = useState(100);
  const [minChange, setMinChange] = useState(-100);

  const { rows, signals } = useMemo(() => {
    const signalMap: Record<string, string[]> = {};
    const rows = assets.filter((a) => {
      const isBull = a.momentum > 10 && a.trendStrength >= 55;
      const isBear = a.momentum < -10 && a.trendStrength >= 45;
      if (trend === "bullish" && !isBull) return false;
      if (trend === "bearish" && !isBear) return false;
      if (a.momentum < minMomentum) return false;
      if (a.volatility > maxVol) return false;
      if (a.rsi < minRsi || a.rsi > maxRsi) return false;
      if (a.changePct24h < minChange) return false;

      const sig: string[] = [];
      if (isBull) sig.push("Tendance haussière");
      if (isBear) sig.push("Tendance baissière");
      if (a.rsi > 70) sig.push("Surachat");
      if (a.rsi < 30) sig.push("Survente");
      if (a.volatility > 60) sig.push("Volatilité élevée");
      if (Math.abs(a.changePct24h) > 3) sig.push("Mouvement fort 24h");
      if (a.trendStrength > 65) sig.push("Tendance forte");
      signalMap[a.symbol] = sig;
      return true;
    });
    return { rows, signals: signalMap };
  }, [assets, trend, minMomentum, maxVol, minRsi, maxRsi, minChange]);

  const reset = () => {
    setTrend("any");
    setMinMomentum(-100);
    setMaxVol(100);
    setMinRsi(0);
    setMaxRsi(100);
    setMinChange(-100);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Filters */}
      <Card className="h-fit p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Radar className="h-4 w-4 text-brand" /> Filtres
          </h3>
          <button onClick={reset} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <RotateCcw className="h-3 w-3" /> Réinitialiser
          </button>
        </div>

        <Field label="Tendance">
          <div className="grid grid-cols-3 gap-1">
            {(["any", "bullish", "bearish"] as Trend[]).map((t) => (
              <button
                key={t}
                onClick={() => setTrend(t)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs transition-colors",
                  trend === t
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border text-ink-muted hover:text-ink",
                )}
              >
                {t === "any" ? "Toutes" : t === "bullish" ? "Haussier" : "Baissier"}
              </button>
            ))}
          </div>
        </Field>

        <Slider label="Momentum min." value={minMomentum} min={-100} max={100} onChange={setMinMomentum} suffix="" />
        <Slider label="Volatilité max." value={maxVol} min={0} max={100} onChange={setMaxVol} suffix="%" />
        <Slider label="RSI min." value={minRsi} min={0} max={100} onChange={setMinRsi} suffix="" />
        <Slider label="RSI max." value={maxRsi} min={0} max={100} onChange={setMaxRsi} suffix="" />
        <Slider label="Variation 24h min." value={minChange} min={-20} max={20} onChange={setMinChange} suffix="%" />
      </Card>

      {/* Results */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">{rows.length}</span> actif{rows.length > 1 ? "s" : ""} correspondant{rows.length > 1 ? "s" : ""}
          </span>
        </div>
        {rows.length > 0 ? (
          <AssetTable assets={rows} extraSignals={signals} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-ink-muted">
            Aucun actif ne remplit ces critères. Élargissez vos filtres.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-ink-muted">{label}</label>
        <span className="tnum text-xs font-medium text-brand">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-hover accent-brand"
      />
    </div>
  );
}
