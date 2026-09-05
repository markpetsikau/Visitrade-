// ─────────────────────────────────────────────────────────────
// marketDataProvider — abstraction layer
//
// The entire app talks ONLY to this interface. By default it is backed
// by REAL data (CoinGecko for crypto, Yahoo Finance for indices and
// commodities). Set MARKET_DATA_PROVIDER=mock to force the simulated
// dataset (offline demos, tests). No UI code needs to change either way.
//
// Le badge « Données en direct / simulées » de l'UI reflète `isLive`.
// ─────────────────────────────────────────────────────────────

import type { Asset, AssetClass } from "@/lib/types";
import { MOCK_ASSETS, MOCK_ASSET_MAP } from "./mock-assets";
import { CoinGeckoProvider } from "./coingecko";

export interface MarketDataProvider {
  readonly source: string;
  readonly isLive: boolean;
  listAssets(filter?: { class?: AssetClass }): Promise<Asset[]>;
  getAsset(symbol: string): Promise<Asset | null>;
  search(query: string): Promise<Asset[]>;
}

class MockProvider implements MarketDataProvider {
  readonly source = "VISITRADE Mock Data";
  readonly isLive = false;

  async listAssets(filter?: { class?: AssetClass }): Promise<Asset[]> {
    const all = MOCK_ASSETS;
    return filter?.class ? all.filter((a) => a.class === filter.class) : all;
  }

  async getAsset(symbol: string): Promise<Asset | null> {
    return MOCK_ASSET_MAP[symbol.toUpperCase()] ?? null;
  }

  async search(query: string): Promise<Asset[]> {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_ASSETS;
    return MOCK_ASSETS.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }
}

/*
 * Sélection du provider — LE TEMPS RÉEL EST LE DÉFAUT.
 *
 *   (non défini) / "live" / "coingecko" → données réelles :
 *        crypto  = CoinGecko (API gratuite, sans clé)
 *        indices & matières premières = Yahoo Finance (sans clé)
 *   "mock" / "off"                     → tout simulé (démos, tests hors ligne).
 *
 * Avant, l'absence de variable d'environnement donnait des cours simulés :
 * un oubli côté hébergeur suffisait à publier de fausses données en prod.
 * Le défaut est désormais le réel ; chaque source retombe d'elle-même sur
 * le jeu simulé en cas de panne d'API, et le badge de l'UI l'indique.
 *
 * Toute autre API réelle (Polygon, Twelve Data, Binance…) n'a qu'à
 * implémenter MarketDataProvider et être branchée ici — aucun changement d'UI.
 */
function selectProvider(): MarketDataProvider {
  const mode = (process.env.MARKET_DATA_PROVIDER ?? "").trim().toLowerCase();
  if (mode === "mock" || mode === "off" || mode === "simule" || mode === "simulé") {
    return new MockProvider();
  }
  return new CoinGeckoProvider();
}

export const provider: MarketDataProvider = selectProvider();

// Convenience server-safe helpers
export const getAllAssets = () => provider.listAssets();
export const getAsset = (s: string) => provider.getAsset(s);
