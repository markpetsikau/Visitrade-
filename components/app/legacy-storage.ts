"use client";

// ─────────────────────────────────────────────────────────────
// Reprise des données de l'époque « tout en localStorage ».
//
// Les comptes existants ont leur watchlist, leur portefeuille et leurs
// alertes dans le navigateur. Au premier chargement post-migration, si le
// serveur est vide et que le navigateur a quelque chose, on remonte ces
// données puis on efface la clé locale — l'utilisateur ne perd rien et
// la bascule est invisible.
// ─────────────────────────────────────────────────────────────

export const LEGACY_KEYS = {
  watchlist: "visitrade_watchlist",
  portfolio: "visitrade_portfolio",
  alerts: "visitrade_alerts",
} as const;

export function readLegacy<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(parsed) && parsed.length === 0 ? null : parsed;
  } catch {
    return null;
  }
}

export function clearLegacy(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}
