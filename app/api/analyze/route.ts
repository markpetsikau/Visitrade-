import { NextResponse } from "next/server";
import { provider } from "@/lib/market-data/provider";
import { llmAnalyzeAsset, isLlmEnabled } from "@/lib/ai/llm";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Garde-fou : 20 analyses IA / minute / IP.
    const rl = rateLimit(`analyze:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }
    const { symbol } = await req.json();
    if (typeof symbol !== "string") {
      return NextResponse.json({ error: "Symbole manquant." }, { status: 400 });
    }
    const asset = await provider.getAsset(symbol);
    if (!asset) {
      return NextResponse.json({ error: "Actif introuvable." }, { status: 404 });
    }
    const analysis = await llmAnalyzeAsset(asset);
    return NextResponse.json({ analysis, live: isLlmEnabled() });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
