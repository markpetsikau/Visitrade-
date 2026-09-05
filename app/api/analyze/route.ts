import { NextResponse } from "next/server";
import { provider } from "@/lib/market-data/provider";
import { llmAnalyzeAsset, isLlmEnabled } from "@/lib/ai/llm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";
import { hasFeature } from "@/lib/plans";
import { getQuota, normalizeSymbol } from "@/lib/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Session obligatoire — une analyse IA coûte un appel LLM,
    //    elle n'est jamais servie à un visiteur anonyme.
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // 2. Garde-fou débit : 20 analyses / minute / compte.
    const rl = rateLimit(`analyze:${session.email || clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const body = await req.json();
    if (typeof body?.symbol !== "string") {
      return NextResponse.json({ error: "Symbole manquant." }, { status: 400 });
    }
    const symbol = normalizeSymbol(body.symbol);

    // 3. Droit d'accès : Pro/Elite en illimité, Free uniquement sur
    //    un symbole déjà débloqué avec son analyse mensuelle.
    if (!hasFeature(session.plan, "fullAnalysis")) {
      const quota = await getQuota();
      if (!quota.symbols.includes(symbol)) {
        return NextResponse.json(
          {
            error:
              "Analyse complète réservée au plan Pro. Le plan Free inclut 1 analyse par mois, à débloquer depuis la fiche de l'actif.",
            upgrade: true,
            remaining: quota.remaining,
          },
          { status: 403 },
        );
      }
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
