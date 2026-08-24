import { NextResponse } from "next/server";
import { provider } from "@/lib/market-data/provider";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = rateLimit(`search:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ items: [] }, { status: 429 });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const results = await provider.search(q);
  // Lightweight payload for the command palette.
  const items = results.slice(0, 40).map((a) => ({
    symbol: a.symbol,
    name: a.name,
    class: a.class,
    image: a.image ?? null,
    price: a.price,
    changePct24h: a.changePct24h,
  }));
  return NextResponse.json({ items });
}
