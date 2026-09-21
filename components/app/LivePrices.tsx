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
    // Symbole affiché pour la première fois : on demande son flux.
    requestStream(sym);
  }
  set.add(cb);
  return () => {
    set!.delete(cb);
  };
}

// ── Connexion temps réel (singleton) ──
//
// Le flux global `!ticker@arr` était ouvert mais ne délivrait jamais rien
// (payload de tout le marché, filtré ou étranglé selon le réseau) : les
// prix n'avançaient donc qu'au sondage HTTP. On s'abonne désormais aux
// flux CIBLÉS des symboles réellement affichés, ajoutés à chaud quand un
// composant en demande un nouveau. Les cours changent alors sous l'œil,
// tick par tick.

// Symboles qui ne viennent pas d'une place crypto : indices et matières
// premières restent servis par le sondage HTTP.
const NON_CRYPTO = new Set([
  "SPX", "NDX", "DJI", "DAX", "VIX", "XAU", "XAG", "WTI", "NG", "HG",
]);

const WS_URL = "wss://stream.binance.com:9443/stream";
const RECONNECT_MS = 3000;

let started = false;
let ws: WebSocket | null = null;
let pending: Record<string, Quote> = {};
let reconnectAt = RECONNECT_MS;

/** Symboles voulus (base en majuscules) et flux déjà souscrits. */
const wanted = new Set<string>();
const subscribed = new Set<string>();
let flushStreamsTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 1;

function streamName(symbol: string): string {
  return `${symbol.toLowerCase()}usdt@ticker`;
}

function requestStream(symbol: string) {
  if (NON_CRYPTO.has(symbol) || wanted.has(symbol)) return;
  wanted.add(symbol);
  scheduleStreamSync();
}

/** Les abonnements partent groupés : Binance limite les messages par seconde. */
function scheduleStreamSync() {
  if (flushStreamsTimer) return;
  flushStreamsTimer = setTimeout(() => {
    flushStreamsTimer = null;
    syncStreams();
  }, 250);
}

function syncStreams() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const toAdd = [...wanted].filter((s) => !subscribed.has(s));
  if (!toAdd.length) return;
  // 200 flux par message : large sous la limite de 1024 par connexion.
  for (let i = 0; i < toAdd.length; i += 200) {
    const chunk = toAdd.slice(i, i + 200);
    ws.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: chunk.map(streamName),
        id: requestId++,
      }),
    );
    chunk.forEach((sym) => subscribed.add(sym));
  }
}

function connectBinance() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      reconnectAt = RECONNECT_MS;
      subscribed.clear(); // une nouvelle connexion repart sans abonnement
      syncStreams();
    };

    ws.onmessage = (ev) => {
      if (!live) return;
      let msg: { stream?: string; data?: { s?: string; c?: string; P?: string } };
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      const d = msg?.data;
      if (!d?.s || typeof d.c !== "string") return;
      const pair = d.s;
      if (!pair.endsWith("USDT")) return;
      const base = pair.slice(0, -4);
      const price = parseFloat(d.c);
      const change24h = parseFloat(d.P ?? "0");
      if (Number.isFinite(price)) pending[base] = { price, change24h };
    };

    ws.onclose = () => {
      ws = null;
      subscribed.clear();
      // Reconnexion avec palier croissant, plafonnée à 30 s.
      setTimeout(connectBinance, reconnectAt);
      reconnectAt = Math.min(reconnectAt * 2, 30_000);
    };

    ws.onerror = () => ws?.close();
  } catch {
    /* WebSocket indisponible → le sondage HTTP prend le relais */
  }
}

function startConnections() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Socle HTTP : indices, matières premières, cryptos absentes de Binance,
  // et filet de sécurité si le WebSocket est filtré.
  const poll = async () => {
    // Mise en pause demandée par l'utilisateur : on ne consomme ni
    // réseau ni quota d'API tant que le direct est coupé.
    if (!live) return;
    try {
      const r = await fetch("/api/prices");
      const d = await r.json();
      if (d.quotes) applyQuotes(d.quotes);
    } catch {
      /* ignore */
    }
  };
  poll();
  setInterval(poll, 10000);

  connectBinance();

  // Les ticks reçus sont appliqués 4 fois par seconde : assez vif pour
  // voir le chiffre bouger, assez groupé pour ne pas saturer le rendu.
  setInterval(() => {
    if (live && Object.keys(pending).length) {
      applyQuotes(pending);
      pending = {};
    }
  }, 250);
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
