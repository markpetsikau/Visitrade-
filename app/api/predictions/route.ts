import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasFeature, FREE_PREDICTION_MARKETS } from "@/lib/plans";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { buildBoard } from "@/lib/predictions/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Board de probabilités, recalculé à chaque appel depuis les cours réels.
// Le client rafraîchit régulièrement ; entre deux appels, il recalcule
// lui-même les probabilités à partir des ticks de prix en direct.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rl = rateLimit(`predictions:${session.email || clientIp(req)}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const board = await buildBoard();
  const unlimited = hasFeature(session.plan, "predictions");
  const markets = unlimited ? board.markets : board.markets.slice(0, FREE_PREDICTION_MARKETS);

  return NextResponse.json({
    markets,
    generatedAt: board.generatedAt,
    live: board.live,
    source: board.source,
    total: board.markets.length,
    locked: board.markets.length - markets.length,
    unlimited,
  });
}
