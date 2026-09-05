// ─────────────────────────────────────────────────────────────
// Quota d'analyses complètes du plan Free — autorité côté serveur.
//
// Avant : le compteur vivait dans le localStorage du navigateur,
// donc il suffisait de vider le cache pour analyses illimitées.
// Maintenant :
//   • Supabase configuré → table `analysis_unlocks` (RLS par user).
//   • Mode démo          → cookie httpOnly (inaccessible au JS client).
//
// Le quota est mensuel et par symbole : débloquer BTC en septembre
// consomme l'unique analyse Free du mois.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import { FREE_MONTHLY_ANALYSES, hasFeature, type Plan } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

export const QUOTA_COOKIE = "visitrade_quota";

export interface Quota {
  month: string;
  symbols: string[];
  remaining: number;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().slice(0, 20);
}

function quota(symbols: string[]): Quota {
  const unique = Array.from(new Set(symbols));
  return {
    month: currentMonth(),
    symbols: unique,
    remaining: Math.max(0, FREE_MONTHLY_ANALYSES - unique.length),
  };
}

// ── Lecture ──────────────────────────────────────────────────
export async function getQuota(): Promise<Quota> {
  const month = currentMonth();

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (!supabase) return quota([]);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return quota([]);
    const { data } = await supabase
      .from("analysis_unlocks")
      .select("symbol")
      .eq("user_id", user.id)
      .eq("month", month);
    return quota((data ?? []).map((r) => r.symbol as string));
  }

  return quota(readCookieQuota().symbols);
}

// ── Écriture (route handlers / server actions uniquement) ─────
export async function unlockAnalysis(
  symbol: string,
): Promise<{ ok: boolean; quota: Quota; reason?: "quota" | "auth" }> {
  const sym = normalizeSymbol(symbol);
  const month = currentMonth();
  const current = await getQuota();

  // Déjà débloqué ce mois-ci : idempotent, ne consomme rien.
  if (current.symbols.includes(sym)) return { ok: true, quota: current };
  if (current.remaining <= 0) return { ok: false, quota: current, reason: "quota" };

  if (isSupabaseConfigured()) {
    const supabase = getServerSupabase();
    if (!supabase) return { ok: false, quota: current, reason: "auth" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, quota: current, reason: "auth" };
    const { error } = await supabase
      .from("analysis_unlocks")
      .insert({ user_id: user.id, month, symbol: sym });
    if (error) return { ok: false, quota: current, reason: "quota" };
    return { ok: true, quota: quota([...current.symbols, sym]) };
  }

  const next = quota([...current.symbols, sym]);
  writeCookieQuota(next);
  return { ok: true, quota: next };
}

// Un plan payant n'a pas de quota : `remaining` reste informatif.
export function isQuotaExempt(plan: Plan | undefined): boolean {
  return hasFeature(plan, "fullAnalysis");
}

// ── Cookie httpOnly (mode démo) ──────────────────────────────
function readCookieQuota(): { month: string; symbols: string[] } {
  const raw = cookies().get(QUOTA_COOKIE)?.value;
  if (!raw) return { month: currentMonth(), symbols: [] };
  try {
    const parsed = JSON.parse(raw) as { month?: string; symbols?: unknown };
    if (parsed.month === currentMonth() && Array.isArray(parsed.symbols)) {
      return { month: parsed.month, symbols: parsed.symbols.filter((s): s is string => typeof s === "string") };
    }
  } catch {
    /* cookie illisible → quota vierge */
  }
  return { month: currentMonth(), symbols: [] };
}

function writeCookieQuota(q: Quota) {
  cookies().set(QUOTA_COOKIE, JSON.stringify({ month: q.month, symbols: q.symbols }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 62,
  });
}
