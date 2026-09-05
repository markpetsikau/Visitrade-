"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChangeBadge } from "@/components/ui/Badge";
import { formatPrice, cn } from "@/lib/utils";

interface Quote {
  price: number;
  change24h: number;
}

// ── External store (per-symbol subscriptions → only changed rows re-render) ──
const quotes = new Map<string, Quote>();
const symSubs = new Map<string, Set<() => void>>();
const metaSubs = new Set<() => void>();
let updatedAt: number | null = null;
let live = true;
let metaVersion = 0;

function notifyMeta() {
  metaVersion++;
  metaSubs.forEach((f) => f());
}

function applyQuotes(map: Record<string, Quote>) {
  let changed = false;
  for (const sym in map) {
    const q = map[sym];
    const prev = quotes.get(sym);
    if (!prev || prev.price !== q.price || prev.change24h !== q.change24h) {
      quotes.set(sym, q);
      symSubs.get(sym)?.forEach((f) => f());
      changed = true;
    }
  }
  if (changed) {
    updatedAt = Date.now();
    notifyMeta();
  }
}

function subscribeSym(sym: string, cb: () => void) {
  let set = symSubs.get(sym);
  if (!set) {
    set = new Set();
    symSubs.set(sym, set);
  }
  set.add(cb);
  return () => {
    set!.delete(cb);
  };
}

// ── Connection manager (singleton) ──
let started = false;
let ws: WebSocket | null = null;
let pending: Record<string, Quote> = {};

function connectBinance() {
  try {
    ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    ws.onmessage = (ev) => {
      if (!live) return;
      let arr: any;
      try {
        arr = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!Array.isArray(arr)) return;
      for (const t of arr) {
        const s: string = t.s;
        if (typeof s === "string" && s.endsWith("USDT")) {
          const base = s.slice(0, -4);
          const price = parseFloat(t.c);
          const change24h = parseFloat(t.P);
          if (Number.isFinite(price)) pending[base] = { price, change24h };
        }
      }
    };
    ws.onclose = () => {
      setTimeout(() => connectBinance(), 3000);
    };
    ws.onerror = () => ws?.close();
  } catch {
    /* WS unavailable → HTTP poll still runs */
  }
}

function startConnections() {
  if (started || typeof window === "undefined") return;
  started = true;

  // HTTP baseline (non-crypto + coins not on Binance + fallback).
  const poll = async () => {
    try {
      const r = await fetch("/api/prices");
      const d = await r.json();
      if (d.quotes) applyQuotes(d.quotes);
    } catch {
      /* ignore */
    }
  };
  poll();
  // 10 s : c'est ce sondage qui garantit la mise à jour continue quand le
  // WebSocket temps réel est indisponible (réseau d'entreprise, filtrage).
  setInterval(poll, 10000);

  // Real-time crypto ticks.
  connectBinance();

  // Flush batched WS updates ~1.2s (keeps re-renders smooth).
  setInterval(() => {
    if (live && Object.keys(pending).length) {
      applyQuotes(pending);
      pending = {};
    }
  }, 1200);
}

// ── Hooks ──
export function LivePricesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startConnections();
  }, []);
  return <>{children}</>;
}

// Non-hook getter (for computing aggregates outside the hook rules).
export function getQuoteNow(symbol: string): Quote | undefined {
  return quotes.get(symbol);
}

export function useLiveQuote(symbol: string, fallback: Quote): Quote {
  const q = useSyncExternalStore(
    (cb) => subscribeSym(symbol, cb),
    () => quotes.get(symbol),
    () => undefined,
  );
  return q ?? fallback;
}

export function useLive() {
  useSyncExternalStore(
    (cb) => {
      metaSubs.add(cb);
      return () => metaSubs.delete(cb);
    },
    () => metaVersion,
    () => 0,
  );
  return {
    updatedAt,
    live,
    toggle: () => {
      live = !live;
      if (live) startConnections();
      notifyMeta();
    },
  };
}

// ── Components ──
export function LivePrice({
  symbol,
  price,
  className,
}: {
  symbol: string;
  price: number;
  className?: string;
}) {
  const q = useLiveQuote(symbol, { price, change24h: 0 });
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef(q.price);

  useEffect(() => {
    if (q.price !== prev.current) {
      setFlash(q.price > prev.current ? "up" : "down");
      prev.current = q.price;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [q.price]);

  return (
    <span
      className={cn(
        "tnum rounded px-1 transition-colors duration-500",
        flash === "up" && "bg-bull/20 text-bull",
        flash === "down" && "bg-bear/20 text-bear",
        className,
      )}
    >
      {formatPrice(q.price)}
    </span>
  );
}

export function LiveChange({ symbol, value }: { symbol: string; value: number }) {
  const q = useLiveQuote(symbol, { price: 0, change24h: value });
  return <ChangeBadge value={q.change24h} />;
}
