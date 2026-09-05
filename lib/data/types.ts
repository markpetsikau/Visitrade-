// ─────────────────────────────────────────────────────────────
// Formes partagées serveur / client pour les données utilisateur.
// Aucun import serveur : les composants clients s'en servent aussi.
// ─────────────────────────────────────────────────────────────

export interface StoredPosition {
  symbol: string;
  qty: number;
  avgPrice: number;
}

export type AlertDirection = "up" | "down";

export interface StoredAlert {
  id: string;
  symbol: string;
  type: string;
  detail: string;
  active: boolean;
  target?: number;
  dir?: AlertDirection;
  triggeredAt?: number;
}

// Plafonds du mode démo (les cookies sont limités à ~4 Ko).
export const DEMO_LIMITS = {
  watchlist: 60,
  positions: 25,
  alerts: 30,
} as const;

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().slice(0, 20);
}
