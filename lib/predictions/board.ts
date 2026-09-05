// ─────────────────────────────────────────────────────────────
// Construction du board de probabilités à partir des données
// de marché RÉELLES (même provider que le reste de l'app).
// Server-only : la page et la route API passent par ici.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { provider } from "@/lib/market-data/provider";
import { marketsForAsset, pickBoardAssets, type PredictionMarket } from "./engine";

export interface Board {
  markets: PredictionMarket[];
  generatedAt: number;
  live: boolean;
  source: string;
}

export async function buildBoard(): Promise<Board> {
  const assets = await provider.listAssets();
  const now = Date.now();
  const markets = pickBoardAssets(assets)
    .flatMap((a) => marketsForAsset(a, now))
    // On écarte les questions jouées d'avance (« l'or sous 3 500 $ aujourd'hui ? »
    // à 0,5 %) : elles n'apprennent rien et polluent le board.
    .filter((m) => m.probability >= 3 && m.probability <= 97)
    // Les questions les plus serrées (proches de 50 %) en premier :
    // ce sont celles qui bougent le plus, comme en tête de Kalshi.
    .sort((a, b) => Math.abs(a.probability - 50) - Math.abs(b.probability - 50));

  return { markets, generatedAt: now, live: provider.isLive, source: provider.source };
}
