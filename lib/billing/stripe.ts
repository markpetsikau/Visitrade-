// ─────────────────────────────────────────────────────────────
// Couche Stripe — abonnements Pro / Elite, mensuels ou annuels.
//
// Tout est piloté par l'environnement : sans STRIPE_SECRET_KEY,
// l'application reste en mode démo (le plan est accordé sans paiement)
// et aucune de ces fonctions n'est appelée.
// ─────────────────────────────────────────────────────────────

import "server-only";
import type { Plan } from "@/lib/plans";

export type Cycle = "monthly" | "yearly";

// Un identifiant de prix Stripe par couple (plan, périodicité).
const PRICE_ENV: Record<Exclude<Plan, "free">, Record<Cycle, string>> = {
  pro: { monthly: "STRIPE_PRICE_PRO", yearly: "STRIPE_PRICE_PRO_YEARLY" },
  elite: { monthly: "STRIPE_PRICE_ELITE", yearly: "STRIPE_PRICE_ELITE_YEARLY" },
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO);
}

export function priceIdFor(plan: Exclude<Plan, "free">, cycle: Cycle): string | undefined {
  const monthly = process.env[PRICE_ENV[plan].monthly];
  if (cycle === "monthly") return monthly;
  // L'annuel est optionnel : à défaut, on facture au mois.
  return process.env[PRICE_ENV[plan].yearly] || monthly;
}

/** Retrouve le plan correspondant à un identifiant de prix Stripe. */
export function planForPrice(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  for (const plan of ["pro", "elite"] as const) {
    for (const cycle of ["monthly", "yearly"] as const) {
      if (process.env[PRICE_ENV[plan][cycle]] === priceId) return plan;
    }
  }
  return null;
}

export async function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(secret);
}

/**
 * Statuts Stripe qui donnent droit au service. `past_due` reste ouvert :
 * on ne coupe pas l'accès sur un incident de paiement passager, Stripe
 * relance et enverra `canceled` si l'échec persiste.
 */
export function statusGrantsAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}
