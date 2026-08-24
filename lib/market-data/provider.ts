// ─────────────────────────────────────────────────────────────
// marketDataProvider — abstraction layer
//
// The entire app talks ONLY to this interface. Today it is backed
// by realistic MOCK data. To go live, implement `MarketDataProvider`
// with a real API (CoinGecko, Polygon, Twelve Data, Binance…) and
// swap `provider` below. No UI code needs to change.
//
// ⚠️ Data here is MOCK / illustrative — clearly flagged in the UI.
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
 * Provider selection.
 *   MARKET_DATA_PROVIDER=coingecko  → live crypto (CoinGecko, free, no key)
 *                                     + mock for indices/commodities.
 *   (unset / anything else)         → fully mock (default).
 *
 * Any other real API (Polygon, Twelve Data, Binance…) just needs to
 * implement MarketDataProvider and be wired here — no UI change.
 */
function selectProvider(): MarketDataProvider {
  if (process.env.MARKET_DATA_PROVIDER === "coingecko") {
    return new CoinGeckoProvider();
  }
  return new MockProvider();
}

export const provider: MarketDataProvider = selectProvider();

// Convenience server-safe helpers
export const getAllAssets = () => provider.listAssets();
export const getAsset = (s: string) => provider.getAsset(s);
