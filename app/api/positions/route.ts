import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasFeature } from "@/lib/plans";
import { getPositions, upsertPosition, removePosition } from "@/lib/data/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  if (!hasFeature(session.plan, "portfolio")) {
    return {
      error: NextResponse.json(
        { error: "Le suivi de portefeuille est réservé au plan Pro.", upgrade: true },
        { status: 403 },
      ),
    };
  }
  return { session };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ positions: await getPositions() });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const body = await req.json().catch(() => null);
  const symbol = typeof body?.symbol === "string" ? body.symbol : "";
  const qty = Number(body?.qty);
  const avgPrice = Number(body?.avgPrice);
  if (!symbol || !(qty > 0) || !(avgPrice > 0)) {
    return NextResponse.json({ error: "Position invalide." }, { status: 400 });
  }

  return NextResponse.json({ positions: await upsertPosition({ symbol, qty, avgPrice }) });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const symbol = new URL(req.url).searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "Symbole manquant." }, { status: 400 });
  return NextResponse.json({ positions: await removePosition(symbol) });
}
