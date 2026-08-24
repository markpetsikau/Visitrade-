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

export interface MarketQuote {
  price: number;
  change24h: number;
  series?: number[];
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
          next: { revalidate: 300 },
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!r.ok) return null;
        const j = await r.json();
        const res = j?.chart?.result?.[0];
        const meta = res?.meta;
        const price: number = meta?.regularMarketPrice;
        const prev: number = meta?.chartPreviousClose ?? meta?.previousClose;
        if (!Number.isFinite(price) || price <= 0) return null;
        const closes: number[] = (res?.indicators?.quote?.[0]?.close || []).filter(
          (v: number) => Number.isFinite(v),
        );
        const change24h =
          Number.isFinite(prev) && prev > 0 ? ((price - prev) / prev) * 100 : 0;
        return [sym, { price, change24h, series: closes.length ? closes : undefined }] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(results.filter(Boolean) as [string, MarketQuote][]);
}
