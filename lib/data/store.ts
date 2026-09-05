// ─────────────────────────────────────────────────────────────
// Magasin des données utilisateur — watchlist, positions, alertes.
//
// Avant, tout vivait dans le localStorage du navigateur : changer de
// téléphone (ou vider son cache) effaçait la watchlist, le portefeuille
// et les alertes. Ces données appartiennent au compte, pas à l'appareil.
//
// Deux back-ends, choisis au même endroit que la session :
//   • Supabase configuré → tables `watchlist`, `positions`, `alerts`
//     (RLS : chacun ne voit que ses lignes).
//   • Mode démo          → cookies httpOnly, plafonnés, pour que la
//     boucle produit reste jouable sans backend.
//
// Les écritures ne sont possibles que depuis un route handler ou une
// server action (contrainte de `cookies().set`).
// ─────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  DEMO_LIMITS,
  normalizeSymbol,
  type StoredAlert,
  type StoredPosition,
} from "./types";

const COOKIE = {
  watchlist: "visitrade_watchlist",
  positions: "visitrade_positions",
  alerts: "visitrade_alerts_v2",
} as const;

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function readCookie<T>(name: string, fallback: T): T {
  const raw = cookies().get(name)?.value;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeCookie(name: string, value: unknown) {
  cookies().set(name, JSON.stringify(value), COOKIE_OPTS);
}

// ── Watchlist ────────────────────────────────────────────────
export async function getWatchlist(): Promise<string[]> {
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    const { data } = await supabase
      .from("watchlist")
      .select("symbol, added_at")
      .eq("user_id", userId)
      .order("added_at", { ascending: true });
    return (data ?? []).map((r) => r.symbol as string);
  }
  return readCookie<string[]>(COOKIE.watchlist, []).map(normalizeSymbol);
}

/** Remplace la watchlist entière (le plafond du plan est appliqué en amont). */
export async function setWatchlist(symbols: string[]): Promise<string[]> {
  const clean = Array.from(new Set(symbols.map(normalizeSymbol).filter(Boolean)));
  const userId = await currentUserId();

  if (userId) {
    const supabase = getServerSupabase()!;
    const { data: existing } = await supabase
      .from("watchlist")
      .select("symbol")
      .eq("user_id", userId);
    const before = new Set((existing ?? []).map((r) => r.symbol as string));
    const after = new Set(clean);

    const toRemove = [...before].filter((s) => !after.has(s));
    const toAdd = clean.filter((s) => !before.has(s));

    if (toRemove.length) {
      await supabase.from("watchlist").delete().eq("user_id", userId).in("symbol", toRemove);
    }
    if (toAdd.length) {
      await supabase
        .from("watchlist")
        .upsert(toAdd.map((symbol) => ({ user_id: userId, symbol })), {
          onConflict: "user_id,symbol",
        });
    }
    return clean;
  }

  const capped = clean.slice(0, DEMO_LIMITS.watchlist);
  writeCookie(COOKIE.watchlist, capped);
  return capped;
}

// ── Positions ────────────────────────────────────────────────
export async function getPositions(): Promise<StoredPosition[]> {
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    const { data } = await supabase
      .from("positions")
      .select("symbol, qty, avg_price")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return (data ?? []).map((r) => ({
      symbol: r.symbol as string,
      qty: Number(r.qty),
      avgPrice: Number(r.avg_price),
    }));
  }
  return readCookie<StoredPosition[]>(COOKIE.positions, []);
}

/** Crée ou remplace la position d'un symbole (le cumul est calculé en amont). */
export async function upsertPosition(pos: StoredPosition): Promise<StoredPosition[]> {
  const symbol = normalizeSymbol(pos.symbol);
  const qty = Number(pos.qty);
  const avgPrice = Number(pos.avgPrice);
  if (!symbol || !(qty > 0) || !(avgPrice > 0)) return getPositions();

  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    // Une seule ligne par symbole : on remplace l'existante.
    await supabase.from("positions").delete().eq("user_id", userId).eq("symbol", symbol);
    await supabase
      .from("positions")
      .insert({ user_id: userId, symbol, qty, avg_price: avgPrice });
    return getPositions();
  }

  const current = readCookie<StoredPosition[]>(COOKIE.positions, []).filter(
    (p) => p.symbol !== symbol,
  );
  const next = [...current, { symbol, qty, avgPrice }].slice(0, DEMO_LIMITS.positions);
  writeCookie(COOKIE.positions, next);
  return next;
}

export async function removePosition(symbol: string): Promise<StoredPosition[]> {
  const sym = normalizeSymbol(symbol);
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    await supabase.from("positions").delete().eq("user_id", userId).eq("symbol", sym);
    return getPositions();
  }
  const next = readCookie<StoredPosition[]>(COOKIE.positions, []).filter(
    (p) => p.symbol !== sym,
  );
  writeCookie(COOKIE.positions, next);
  return next;
}

// ── Alertes ──────────────────────────────────────────────────
function rowToAlert(r: Record<string, unknown>): StoredAlert {
  const triggered = r.triggered_at ? Date.parse(String(r.triggered_at)) : undefined;
  return {
    id: String(r.id),
    symbol: String(r.symbol),
    type: String(r.type),
    detail: String(r.detail ?? ""),
    active: Boolean(r.active),
    target: r.target === null || r.target === undefined ? undefined : Number(r.target),
    dir: (r.dir as StoredAlert["dir"]) ?? undefined,
    triggeredAt: Number.isFinite(triggered) ? triggered : undefined,
  };
}

export async function getAlerts(): Promise<StoredAlert[]> {
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    // `select("*")` plutôt que la liste des colonnes : tant que la
    // migration ajoutant `triggered_at` n'est pas passée, nommer cette
    // colonne ferait échouer la requête et viderait la liste à l'écran.
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToAlert);
  }
  return readCookie<StoredAlert[]>(COOKIE.alerts, []);
}

export async function createAlert(
  alert: Omit<StoredAlert, "id" | "triggeredAt">,
): Promise<StoredAlert[]> {
  const symbol = normalizeSymbol(alert.symbol);
  if (!symbol || !alert.type) return getAlerts();

  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    await supabase.from("alerts").insert({
      user_id: userId,
      symbol,
      type: alert.type.slice(0, 60),
      detail: alert.detail.slice(0, 200),
      target: alert.target ?? null,
      dir: alert.dir ?? null,
      active: alert.active !== false,
    });
    return getAlerts();
  }

  const current = readCookie<StoredAlert[]>(COOKIE.alerts, []);
  const next = [
    {
      ...alert,
      symbol,
      detail: alert.detail.slice(0, 200),
      id: `a-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    },
    ...current,
  ].slice(0, DEMO_LIMITS.alerts);
  writeCookie(COOKIE.alerts, next);
  return next;
}

export async function updateAlert(
  id: string,
  patch: { active?: boolean; triggeredAt?: number },
): Promise<StoredAlert[]> {
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    const row: Record<string, unknown> = {};
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.triggeredAt !== undefined)
      row.triggered_at = new Date(patch.triggeredAt).toISOString();
    if (Object.keys(row).length) {
      const { error } = await supabase
        .from("alerts")
        .update(row)
        .eq("user_id", userId)
        .eq("id", id);
      // Repli si la colonne `triggered_at` n'existe pas encore : on écrit
      // au moins l'état actif/inactif, pour que l'alerte ne se
      // redéclenche pas en boucle avant la migration.
      if (error && row.triggered_at !== undefined && row.active !== undefined) {
        await supabase
          .from("alerts")
          .update({ active: row.active })
          .eq("user_id", userId)
          .eq("id", id);
      }
    }
    return getAlerts();
  }

  const next = readCookie<StoredAlert[]>(COOKIE.alerts, []).map((a) =>
    a.id === id ? { ...a, ...patch } : a,
  );
  writeCookie(COOKIE.alerts, next);
  return next;
}

export async function removeAlert(id: string): Promise<StoredAlert[]> {
  const userId = await currentUserId();
  if (userId) {
    const supabase = getServerSupabase()!;
    await supabase.from("alerts").delete().eq("user_id", userId).eq("id", id);
    return getAlerts();
  }
  const next = readCookie<StoredAlert[]>(COOKIE.alerts, []).filter((a) => a.id !== id);
  writeCookie(COOKIE.alerts, next);
  return next;
}
