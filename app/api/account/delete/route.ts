import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStripe } from "@/lib/billing/stripe";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Suppression de compte — RGPD article 17 (droit à l'effacement).
 *
 * Ordre des opérations, qui n'est pas anodin :
 *   1. l'abonnement Stripe est résilié immédiatement — sans ça on
 *      continuerait de prélever quelqu'un dont le compte n'existe plus ;
 *   2. l'utilisateur est supprimé de `auth.users`, ce qui efface en
 *      cascade watchlist, positions, alertes, journal, quotas et profil
 *      (toutes les tables déclarent `on delete cascade`).
 *
 * La suppression de l'utilisateur exige la clé service role : le client
 * utilisateur n'a pas ce droit. Sans elle, on refuse franchement plutôt
 * que d'effacer à moitié.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const rl = rateLimit(`delete:${session.email || clientIp(req)}`, 5, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  // Confirmation explicite : l'utilisateur retape son adresse email.
  // Un simple bouton se clique par erreur, une adresse ne se tape pas par accident.
  const body = await req.json().catch(() => null);
  const confirm = typeof body?.confirm === "string" ? body.confirm.trim() : "";
  if (confirm.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Saisissez votre adresse email exacte pour confirmer." },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Suppression indisponible." }, { status: 503 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Suppression indisponible." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    // Mieux vaut dire non que laisser un compte à moitié effacé.
    console.error(
      "[VISITRADE] Suppression de compte impossible : SUPABASE_SERVICE_ROLE_KEY absente.",
    );
    return NextResponse.json(
      {
        error:
          "La suppression automatique est momentanément indisponible. " +
          "Écrivez-nous et nous supprimerons votre compte sous 30 jours.",
      },
      { status: 503 },
    );
  }

  // 1. Couper la facturation avant tout le reste.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  const subId = profile?.stripe_subscription_id as string | undefined;
  if (subId) {
    try {
      const stripe = await getStripe();
      // Résiliation immédiate : le compte disparaît, l'abonnement aussi.
      if (stripe) await stripe.subscriptions.cancel(subId);
    } catch (error) {
      // On trace mais on continue : un abonnement déjà résilié côté
      // Stripe ne doit pas empêcher l'effacement demandé.
      console.error("[VISITRADE] Résiliation Stripe à la suppression :", error);
    }
  }

  // 2. Effacement — la cascade emporte toutes les tables rattachées.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[VISITRADE] Échec de suppression du compte :", error.message);
    return NextResponse.json(
      { error: "La suppression a échoué. Réessayez ou contactez-nous." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true });
}
