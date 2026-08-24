import { NextResponse } from "next/server";
import { provider } from "@/lib/market-data/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Candle = { time: number; open: number; high: number; low: number; close: number };

// Synthesize plausible candles from a close series (for mock assets that
// have no live OHLC endpoint — indices, commodities).
function synth(spark: number[], days: number): Candle[] {
  if (spark.length < 2) return [];
  const now = Math.floor(Date.now() / 1000);
  const step = Math.floor((days * 86400) / spark.length);
  const out: Candle[] = [];
  for (let i = 1; i < spark.length; i++) {
    const open = spark[i - 1];
    const close = spark[i];
    const hi = Math.max(open, close) * (1 + Math.abs(Math.sin(i)) * 0.004);
    const lo = Math.min(open, close) * (1 - Math.abs(Math.cos(i)) * 0.004);
    out.push({
      time: now - (spark.length - i) * step,
      open,
      close,
      high: hi,
      low: lo,
    });
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));

  const asset = await provider.getAsset(symbol);
  if (!asset) return NextResponse.json({ error: "Actif introuvable." }, { status: 404 });

  // Live crypto → real OHLC candles from CoinGecko.
  if (asset.id) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${asset.id}/ohlc?vs_currency=usd&days=${days}`,
        { next: { revalidate: 120 } },
      );
      if (res.ok) {
        const raw = (await res.json()) as number[][];
        const candles: Candle[] = raw.map((c) => ({
          time: Math.floor(c[0] / 1000),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
        }));
        return NextResponse.json({ candles, live: true });
      }
    } catch {
      /* fall through to synth */
    }
  }

  // Mock / non-crypto → synthesized candles from the sparkline.
  return NextResponse.json({ candles: synth(asset.spark, days), live: false });
}
