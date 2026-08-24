import { NextResponse } from "next/server";
import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";
import { fetchMarketQuotes } from "@/lib/market-data/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight, frequently-refreshed quotes for the live ticker.
// (No sparkline → small & fast; safe to poll often.)
export async function GET() {
  const quotes: Record<string, { price: number; change24h: number }> = {};

  // Non-crypto: real quotes (Stooq) with mock fallback.
  const real =
    process.env.MARKET_DATA_PROVIDER === "coingecko" ? await fetchMarketQuotes() : {};
  for (const a of MOCK_ASSETS) {
    if (a.class !== "crypto") {
      const q = real[a.symbol];
      quotes[a.symbol] = q
        ? { price: q.price, change24h: q.change24h }
        : { price: a.price, change24h: a.changePct24h };
    }
  }

  if (process.env.MARKET_DATA_PROVIDER === "coingecko") {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd" +
          "&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h",
        { next: { revalidate: 20 } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          symbol: string;
          current_price: number;
          price_change_percentage_24h: number | null;
        }[];
        for (const m of data) {
          const sym = m.symbol.toUpperCase();
          if (!quotes[sym]) {
            quotes[sym] = {
              price: m.current_price,
              change24h: m.price_change_percentage_24h ?? 0,
            };
          }
        }
      }
    } catch {
      /* keep mock crypto quotes below */
    }
  }

  // Ensure mock crypto have a quote too (fallback when not live).
  for (const a of MOCK_ASSETS) {
    if (a.class === "crypto" && !quotes[a.symbol]) {
      quotes[a.symbol] = { price: a.price, change24h: a.changePct24h };
    }
  }

  return NextResponse.json({ quotes });
}
