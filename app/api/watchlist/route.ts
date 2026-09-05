import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { WATCHLIST_MAX } from "@/lib/plans";
import { getWatchlist, setWatchlist } from "@/lib/data/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const symbols = await getWatchlist();
  const max = WATCHLIST_MAX[session.plan];
  return NextResponse.json({ symbols, max: Number.isFinite(max) ? max : null });
}

// Remplacement complet : la watchlist est courte, et le plafond du plan
// est appliqué ici — le client ne peut pas le contourner.
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.symbols)) {
    return NextResponse.json({ error: "Liste manquante." }, { status: 400 });
  }

  const max = WATCHLIST_MAX[session.plan];
  const requested = body.symbols.filter((s: unknown): s is string => typeof s === "string");
  const capped = Number.isFinite(max) ? requested.slice(0, max) : requested;
  const symbols = await setWatchlist(capped);

  return NextResponse.json({
    symbols,
    max: Number.isFinite(max) ? max : null,
    truncated: requested.length > capped.length,
  });
}
