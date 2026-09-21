import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Export des données personnelles — RGPD article 20 (portabilité).
 *
 * Renvoie tout ce que le compte contient, dans un format lisible et
 * réutilisable. La lecture passe par le client utilisateur : la
 * protection par ligne garantit qu'on n'exporte que ses propres données,
 * même si ce code se trompait de filtre.
 */

// Les tables qui contiennent des données du compte. Toute nouvelle table
// rattachée à un utilisateur doit être ajoutée ici, sinon l'export ment.
const USER_TABLES = [
  "watchlist",
  "positions",
  "alerts",
  "journal",
  "analysis_unlocks",
] as const;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Un export est coûteux et n'a aucune raison d'être demandé en rafale.
  const rl = rateLimit(`export:${session.email || clientIp(req)}`, 5, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop d'exports demandés. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const exportedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Export indisponible pour le moment." },
      { status: 503 },
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Export indisponible." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const tables: Record<string, unknown[]> = {};
  for (const table of USER_TABLES) {
    const { data } = await supabase.from(table).select("*").eq("user_id", user.id);
    tables[table] = data ?? [];
  }

  const payload = {
    service: "VISITRADE",
    exportedAt,
    compte: {
      id: user.id,
      email: user.email,
      creeLe: user.created_at,
      derniereConnexion: user.last_sign_in_at,
    },
    // Le profil porte des identifiants Stripe : ce sont les références
    // de facturation de la personne, elles font partie de l'export.
    profil: profile ?? null,
    donnees: tables,
  };

  const stamp = exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="visitrade-donnees-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
