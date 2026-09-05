import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth/session";
import type { Plan } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, priceIdFor, type Cycle } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ouvre un paiement Stripe. Le plan n'est PAS accordé ici : seul le
 * webhook, qui reçoit la confirmation de Stripe, a le droit de l'écrire.
 * Revenir sur l'URL de succès ne suffit donc plus à devenir Pro.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan = body?.plan as Plan;
  const cycle: Cycle = body?.cycle === "yearly" ? "yearly" : "monthly";
  if (!["free", "pro", "elite"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  // Retour au gratuit : passe par le portail Stripe quand il y a un
  // abonnement réel (résiliation), sinon changement direct en démo.
  if (plan === "free") {
    if (isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Pour résilier, ouvrez la gestion de votre abonnement — vous gardez l'accès jusqu'à la fin de la période payée.",
          usePortal: true,
        },
        { status: 409 },
      );
    }
    await grantDemoPlan("free");
    return NextResponse.json({ demo: true, plan: "free" });
  }

  const stripe = await getStripe();
  const priceId = priceIdFor(plan, cycle);
  const origin = new URL(req.url).origin;

  if (stripe && priceId) {
    try {
      const customer = await ensureCustomer(session.email, session.name);
      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        ...(customer ? { customer } : { customer_email: session.email }),
        client_reference_id: session.email,
        allow_promotion_codes: true,
        success_url: `${origin}/settings?upgraded=${plan}`,
        cancel_url: `${origin}/pricing`,
        subscription_data: { metadata: { plan, email: session.email } },
        metadata: { plan, email: session.email },
      });
      return NextResponse.json({ url: checkout.url });
    } catch {
      return NextResponse.json({ error: "Stripe indisponible." }, { status: 502 });
    }
  }

  // Mode démo (aucune clé) : le plan est accordé tout de suite pour que
  // la boucle produit reste jouable sans compte Stripe.
  await grantDemoPlan(plan);
  return NextResponse.json({ demo: true, plan });
}

/** Client Stripe du compte : réutilisé s'il existe, créé sinon. */
async function ensureCustomer(email: string, name: string): Promise<string | null> {
  const stripe = await getStripe();
  if (!stripe || !isSupabaseConfigured()) return null;

  const supabase = getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const existing = profile?.stripe_customer_id as string | undefined;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { supabase_user_id: user.id },
  });
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);
  return customer.id;
}

/** Changement de plan sans paiement — mode démo uniquement. */
async function grantDemoPlan(plan: Plan) {
  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ plan }).eq("id", user.id);
    return;
  }
  const s = await getSession();
  if (!s) return;
  cookies().set(SESSION_COOKIE, JSON.stringify({ ...s, plan }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
