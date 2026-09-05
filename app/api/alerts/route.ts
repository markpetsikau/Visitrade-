import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasFeature } from "@/lib/plans";
import { getAlerts, createAlert, updateAlert, removeAlert } from "@/lib/data/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  if (!hasFeature(session.plan, "alerts")) {
    return {
      error: NextResponse.json(
        { error: "Les alertes sont réservées au plan Pro.", upgrade: true },
        { status: 403 },
      ),
    };
  }
  return { session };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ alerts: await getAlerts() });
}

export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const body = await req.json().catch(() => null);
  if (typeof body?.symbol !== "string" || typeof body?.type !== "string") {
    return NextResponse.json({ error: "Alerte invalide." }, { status: 400 });
  }
  const target = Number(body.target);

  const alerts = await createAlert({
    symbol: body.symbol,
    type: body.type,
    detail: typeof body.detail === "string" ? body.detail : "",
    active: body.active !== false,
    target: Number.isFinite(target) && target > 0 ? target : undefined,
    dir: body.dir === "up" || body.dir === "down" ? body.dir : undefined,
  });
  return NextResponse.json({ alerts });
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string") {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }
  const patch: { active?: boolean; triggeredAt?: number } = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (Number.isFinite(body.triggeredAt)) patch.triggeredAt = Number(body.triggeredAt);

  return NextResponse.json({ alerts: await updateAlert(body.id, patch) });
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  return NextResponse.json({ alerts: await removeAlert(id) });
}
