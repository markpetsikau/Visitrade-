import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Plan } from "@/lib/plans";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getStripe, planForPrice, statusGrantsAccess } from "@/lib/billing/stripe";
import { sendPlanActivatedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — SEULE source autorisée à écrire le plan d'un compte.
 *
 * Sans lui, revenir sur l'URL de succès suffisait à devenir Pro : il
 * suffisait de visiter l'adresse à la main. Ici, rien n'est accepté sans
 * une signature Stripe valide.
 *
 * À configurer dans Stripe → Developers → Webhooks, sur :
 *   checkout.session.completed
 *   customer.subscription.created / updated / deleted
 */
export async function POST(req: Request) {
  const stripe = await getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Facturation non configurée." }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  // La signature se vérifie sur le corps BRUT : pas de req.json() ici.
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode !== "subscription" || !s.subscription) break;
        const sub = await stripe.subscriptions.retrieve(String(s.subscription));
        await applySubscription(stripe, sub);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(stripe, event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch {
    // Stripe réessaie si l'on renvoie une erreur : on la signale.
    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function applySubscription(stripe: Stripe, sub: Stripe.Subscription) {
  const admin = getAdminSupabase();
  if (!admin) return; // pas de clé service role → rien à écrire

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id;
  const paidPlan: Plan = planForPrice(priceId) ?? "pro";

  // Un abonnement résilié ou impayé ramène au plan gratuit.
  const active = sub.status !== "canceled" && statusGrantsAccess(sub.status);
  const plan: Plan = active ? paidPlan : "free";

  // Depuis l'API 2025, la fin de période est portée par la ligne
  // d'abonnement, plus par l'abonnement lui-même.
  const periodEnd = item?.current_period_end;

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const userId = await findUserId(stripe, admin, customerId);
  if (!userId) return;

  const { data: before } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  await admin
    .from("profiles")
    .update({
      plan,
      plan_status: sub.status,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: sub.id,
      plan_renews_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      plan_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    })
    .eq("id", userId);

  // Confirmation par email, uniquement au passage vers un plan payant.
  if (active && before?.plan !== plan && plan !== "free" && customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    const email = !("deleted" in customer) ? customer.email : null;
    if (email) await sendPlanActivatedEmail(email, plan);
  }
}

/**
 * Retrouve le compte visé. En priorité par l'identifiant client Stripe
 * enregistré au moment du paiement ; à défaut par l'identifiant Supabase
 * gardé dans les métadonnées du client Stripe.
 */
async function findUserId(
  stripe: Stripe,
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  customerId: string | undefined,
): Promise<string | null> {
  if (!customerId) return null;

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (data?.id) return String(data.id);

  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer) return null;
  const fromMeta = customer.metadata?.supabase_user_id;
  return fromMeta ? String(fromMeta) : null;
}
