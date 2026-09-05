// ─────────────────────────────────────────────────────────────
// Session layer.
//
// Two modes, decided at runtime by whether Supabase is configured:
//   • Supabase  → real accounts. The session is derived from the
//     authenticated Supabase user + their `profiles` row.
//   • Demo      → a lightweight cookie session (no backend needed),
//     so the product loop still works locally with zero config.
//
// `getSession()` is async in both modes — callers must await it.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import type { Plan } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

export type { Plan };

export interface Session {
  email: string;
  name: string;
  plan: Plan;
  onboarded: boolean;
  /** Statut Stripe brut (active, past_due, canceled…), si abonnement. */
  planStatus?: string;
  /** Fin de la période payée en cours, en millisecondes. */
  planRenewsAt?: number;
  /** L'abonnement s'arrête à la fin de la période en cours. */
  cancelAtPeriodEnd?: boolean;
  /** Un client Stripe existe : le portail de gestion est ouvrable. */
  hasBilling?: boolean;
  tradingStyle?: string;
  markets?: string[];
  level?: string;
  watchlist?: string[];
}

export const SESSION_COOKIE = "visitrade_session";

export async function getSession(): Promise<Session | null> {
  if (isSupabaseConfigured()) return getSupabaseSession();
  return getDemoSession();
}

// ── Supabase-backed session ──────────────────────────────────
async function getSupabaseSession(): Promise<Session | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // `select("*")` volontairement : nommer les colonnes d'abonnement ferait
  // échouer la requête tant que la migration SQL n'est pas passée — et un
  // profil illisible ramènerait tout le monde au plan gratuit.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const email = user.email ?? "";
  const metaName =
    (user.user_metadata?.name as string | undefined) ?? undefined;

  return {
    email,
    name: profile?.name || metaName || nameFromEmail(email),
    plan: (profile?.plan as Plan) || "free",
    onboarded: Boolean(profile?.onboarded),
    tradingStyle: profile?.trading_style ?? undefined,
    level: profile?.level ?? undefined,
    markets: profile?.markets ?? undefined,
    planStatus: profile?.plan_status ?? undefined,
    planRenewsAt: profile?.plan_renews_at
      ? Date.parse(String(profile.plan_renews_at))
      : undefined,
    cancelAtPeriodEnd: Boolean(profile?.plan_cancel_at_period_end),
    hasBilling: Boolean(profile?.stripe_customer_id),
    // Watchlist lives in its own table now; loaded where needed.
    watchlist: undefined,
  };
}

// ── Demo cookie session ──────────────────────────────────────
function getDemoSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "trader";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
