// ─────────────────────────────────────────────────────────────
// Rédaction (censure) de l'analyse pour les utilisateurs non
// autorisés. Le composant `AiAnalysisPanel teaser` masquait
// visuellement les sections payantes, mais l'objet complet était
// quand même sérialisé dans la page : lisible dans le HTML.
//
// Ici on retire la donnée elle-même, côté serveur, avant envoi.
// Client-safe (fonctions pures, aucun import server-only).
// ─────────────────────────────────────────────────────────────

import type { AiAnalysis } from "@/lib/types";

/**
 * Ne conserve que ce que le plan Free voit réellement :
 * symbole, date, contexte et direction/force de tendance.
 * Tout le reste (données observées, niveaux, scénarios, risques,
 * synthèse) est vidé — pas seulement masqué.
 */
export function toTeaser(analysis: AiAnalysis): AiAnalysis {
  return {
    symbol: analysis.symbol,
    generatedAt: analysis.generatedAt,
    context: analysis.context,
    trend: { direction: analysis.trend.direction, strength: analysis.trend.strength, note: "" },
    observed: [],
    momentum: { reading: "", note: "" },
    volatility: { reading: "", note: "" },
    keyLevels: [],
    scenarios: [],
    riskFactors: [],
    summary: "",
  };
}
