// ─────────────────────────────────────────────────────────────
// Yahoo Finance — free real quotes for indices & commodities (no key).
// One chart request per symbol (cached), returns price, 24h change and
// a real daily close series (for charts & indicators). Any failure falls
// back to the mock values, so nothing breaks.
// ─────────────────────────────────────────────────────────────

// VISITRADE symbol → Yahoo symbol
const YF: Record<string, string> = {
  SPX: "^GSPC",
  NDX: "^NDX",
  DJI: "^DJI",
  DAX: "^GDAXI",
  VIX: "^VIX",
  XAU: "GC=F",
  XAG: "SI=F",
  WTI: "CL=F",
  NG: "NG=F",
  HG: "HG=F",
};

/** Le symbole Yahoo correspondant, s'il en existe un. */
export function yahooSymbolFor(symbol: string): string | undefined {
  return YF[symbol.toUpperCase()];
}

export interface YahooCandle {
  time: number; // epoch secondes
  open: number;
  high: number;
  low: number;
  close: number;
}

/*
 * Bougies réelles pour les indices et matières premières.
 *
 * /api/chart fabriquait jusqu'ici des mèches à coups de sinus sur la
 * série des clôtures : les corps étaient réels, les plus-hauts et
 * plus-bas inventés. Sur un produit d'analyse technique, où une mèche
 * de rejet est un signal à part entière, c'était indéfendable. Yahoo
 * renvoie l'OHLC complet dans la même requête — il suffisait de le lire.
 */
const RANGE_FOR_DAYS: { maxDays: number; interval: string; range: string }[] = [
  { maxDays: 1, interval: "5m", range: "1d" },
  { maxDays: 7, interval: "60m", range: "5d" },
  { maxDays: 31, interval: "1d", range: "1mo" },
  { maxDays: 93, interval: "1d", range: "3mo" },
  { maxDays: 186, interval: "1d", range: "6mo" },
  { maxDays: 3650, interval: "1d", range: "1y" },
];

export async function fetchYahooCandles(
  symbol: string,
  days: number,
): Promise<YahooCandle[] | null> {
  const yf = yahooSymbolFor(symbol);
  if (!yf) return null;

  const plan =
    RANGE_FOR_DAYS.find((r) => days <= r.maxDays) ??
    RANGE_FOR_DAYS[RANGE_FOR_DAYS.length - 1];

  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yf)}` +
      `?interval=${plan.interval}&range=${plan.range}`;
    const r = await fetch(url, {
      // Les bougies intrajournalières bougent vite, les quotidiennes non.
      next: { revalidate: plan.interval === "1d" ? 300 : 60 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) return null;

    const j = await r.json();
    const res = j?.chart?.result?.[0];
    const ts: number[] = res?.timestamp ?? [];
    const q = res?.indicators?.quote?.[0];
    if (!ts.length || !q) return null;

    const out: YahooCandle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const open = q.open?.[i];
      const high = q.high?.[i];
      const low = q.low?.[i];
      const close = q.close?.[i];
      // Yahoo laisse des trous (jours fériés, séances tronquées) : on saute.
      if (
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        continue;
      }
      out.push({ time: ts[i], open, high, low, close });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export interface MarketQuote {
  price: number;
  change24h: number;
  series?: number[];
}

/**
 * Variation depuis la clôture précédente, en pourcentage.
 *
 * Extrait de la boucle de récupération pour être vérifiable sans réseau :
 * c'est le calcul qui, en lisant `chartPreviousClose`, affichait une
 * variation sur trois mois sous l'étiquette « 24 h ».
 *
 * `closes` est la série des clôtures quotidiennes, la plus récente en
 * dernier. Sa dernière valeur est celle de la séance en cours et suit
 * donc le prix courant : la référence est alors l'avant-dernière.
 */
export function changeSincePreviousClose(
  price: number,
  closes: number[],
  meta?: { previousClose?: number; chartPreviousClose?: number },
): number {
  if (!(price > 0)) return 0;

  const last = closes[closes.length - 1];
  const lastIsCurrentSession =
    Number.isFinite(last) && Math.abs(last - price) / price < 0.001;
  const fromSeries = lastIsCurrentSession ? closes[closes.length - 2] : last;

  const prev = Number.isFinite(fromSeries)
    ? fromSeries
    : (meta?.previousClose ?? meta?.chartPreviousClose);

  if (!Number.isFinite(prev) || !(prev! > 0)) return 0;
  return ((price - prev!) / prev!) * 100;
}

export async function fetchMarketQuotes(): Promise<Record<string, MarketQuote>> {
  const entries = Object.entries(YF);
  const results = await Promise.all(
    entries.map(async ([sym, yf]) => {
      try {
        const url =
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yf)}` +
          `?interval=1d&range=3mo`;
        const r = await fetch(url, {
          next: { revalidate: 60 },
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!r.ok) return null;
        const j = await r.json();
        const res = j?.chart?.result?.[0];
        const meta = res?.meta;
        const price: number = meta?.regularMarketPrice;
        if (!Number.isFinite(price) || price <= 0) return null;
        const closes: number[] = (res?.indicators?.quote?.[0]?.close || []).filter(
          (v: number) => Number.isFinite(v),
        );

        // ⚠️ `chartPreviousClose` est la clôture qui précède la FENÊTRE
        // demandée (ici 3 mois), pas celle de la veille : l'utiliser
        // affichait la variation trimestrielle sous l'étiquette « 24 h »
        // (le DAX ressortait à +4,4 % un jour de marché calme).
        // La clôture de la veille est le dernier point de la série qui
        // n'est pas la séance en cours.
        const change24h = changeSincePreviousClose(price, closes, meta);
        return [sym, { price, change24h, series: closes.length ? closes : undefined }] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(results.filter(Boolean) as [string, MarketQuote][]);
}
