// ─────────────────────────────────────────────────────────────
// Plan entitlements — the subscription-gating strategy (VISIFOOT-style).
//
// Free is deliberately minimal to drive conversion: a partial analysis
// teaser + a hard quota of 1 full AI analysis per month. Everything with
// real depth (scenarios, scanner, assistant, advanced stats, alerts,
// portfolio, journal) is locked behind Pro / Elite.
//
// Client-safe (no server-only) so both server and client can gate.
// ─────────────────────────────────────────────────────────────

export type Plan = "free" | "pro" | "elite";

const RANK: Record<Plan, number> = { free: 0, pro: 1, elite: 2 };

export type Feature =
  | "fullAnalysis"
  | "scenarios"
  | "scanner"
  | "assistant"
  | "advancedStats"
  | "alerts"
  | "portfolio"
  | "journal"
  | "export";

// Minimum plan rank required for each feature.
const MIN_RANK: Record<Feature, number> = {
  fullAnalysis: 1, // Pro
  scenarios: 1, // Pro
  scanner: 1, // Pro
  assistant: 1, // Pro
  advancedStats: 1, // Pro
  alerts: 1, // Pro
  portfolio: 1, // Pro
  journal: 2, // Elite
  export: 2, // Elite
};

export function hasFeature(plan: Plan | undefined, f: Feature): boolean {
  return RANK[plan ?? "free"] >= MIN_RANK[f];
}

export function minPlanFor(f: Feature): Plan {
  return MIN_RANK[f] >= 2 ? "elite" : "pro";
}

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};

// Free plan limits
export const WATCHLIST_MAX: Record<Plan, number> = {
  free: 3,
  pro: Infinity,
  elite: Infinity,
};

export const FREE_MONTHLY_ANALYSES = 1;

export const FEATURE_LABEL: Record<Feature, string> = {
  fullAnalysis: "Analyse IA complète",
  scenarios: "Scénarios de marché",
  scanner: "Scanner de marché",
  assistant: "Assistant IA",
  advancedStats: "Statistiques avancées",
  alerts: "Alertes",
  portfolio: "Portfolio",
  journal: "Journal de trading",
  export: "Export de données",
};
