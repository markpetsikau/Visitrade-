import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasFeature, FREE_MONTHLY_ANALYSES } from "@/lib/plans";
import { getQuota, unlockAnalysis, normalizeSymbol } from "@/lib/quota";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// État du quota d'analyses complètes du mois.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const unlimited = hasFeature(session.plan, "fullAnalysis");
  const quota = await getQuota();
  return NextResponse.json({ ...quota, unlimited, monthlyLimit: FREE_MONTHLY_ANALYSES });
}

// Consomme l'analyse gratuite du mois sur un symbole.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rl = rateLimit(`quota:${session.email || clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.symbol !== "string" || !body.symbol.trim()) {
    return NextResponse.json({ error: "Symbole manquant." }, { status: 400 });
  }
  const symbol = normalizeSymbol(body.symbol);

  // Plan payant : rien à consommer.
  if (hasFeature(session.plan, "fullAnalysis")) {
    const quota = await getQuota();
    return NextResponse.json({ ...quota, unlimited: true });
  }

  const res = await unlockAnalysis(symbol);
  if (!res.ok) {
    return NextResponse.json(
      {
        error:
          res.reason === "quota"
            ? "Votre analyse complète gratuite du mois est déjà utilisée."
            : "Non authentifié.",
        ...res.quota,
        unlimited: false,
      },
      { status: res.reason === "auth" ? 401 : 403 },
    );
  }
  return NextResponse.json({ ...res.quota, unlimited: false });
}
