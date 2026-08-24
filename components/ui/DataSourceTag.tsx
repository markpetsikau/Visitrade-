"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Self-determining data-source badge. Fetches the provider status once
// and shows whether crypto data is live (CoinGecko) or simulated.
export function DataSourceTag({ className }: { className?: string }) {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/market/status")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  if (live === null) return null;

  if (live) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand",
          className,
        )}
        title="Crypto en temps réel (CoinGecko/Binance). Indices, or & matières premières en données réelles (Stooq)."
      >
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" />
        Données en direct
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn",
        className,
      )}
      title="Données simulées — l'architecture est prête à brancher une API réelle (MARKET_DATA_PROVIDER=coingecko)."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      Données simulées
    </span>
  );
}
