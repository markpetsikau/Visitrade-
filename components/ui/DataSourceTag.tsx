"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Badge de provenance des données.
//
// L'infobulle citait « Stooq », une source qui n'est plus utilisée. Et
// surtout, « Données en direct » était affiché à l'identique pour une
// crypto (flux Binance, tick par tick) et pour le CAC ou l'or (cotation
// Yahoo rafraîchie environ toutes les minutes) : deux réalités très
// différentes sous la même étiquette. Le badge distingue désormais les
// deux quand la classe d'actif est connue.
export function DataSourceTag({
  className,
  assetClass,
}: {
  className?: string;
  assetClass?: string;
}) {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/market/status")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  if (live === null) return null;

  if (live) {
    const delayed = assetClass !== undefined && assetClass !== "crypto";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          delayed
            ? "border-border-strong bg-surface-raised text-ink-muted"
            : "border-brand/25 bg-brand/10 text-brand",
          className,
        )}
        title={
          delayed
            ? "Cotation réelle Yahoo Finance, rafraîchie environ toutes les minutes."
            : "Cours réel en continu : flux Binance (tick par tick), complété par CoinGecko."
        }
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            delayed ? "bg-ink-faint" : "animate-pulse-dot bg-brand",
          )}
        />
        {delayed ? "Cotation différée (~1 min)" : "Temps réel"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn",
        className,
      )}
      title="Données simulées (MARKET_DATA_PROVIDER=mock). Retirez cette variable pour repasser en données réelles."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      Données simulées
    </span>
  );
}
