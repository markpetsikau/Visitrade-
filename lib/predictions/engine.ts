// ─────────────────────────────────────────────────────────────
// Moteur de probabilités — inspiration Kalshi, sans pari.
//
// Chaque « marché » est une question binaire datée :
//   « BTC au-dessus de 82 000 $ dans 7 jours ? » → 41 %
//
// La probabilité n'est PAS inventée : elle sort d'un modèle
// log-normal sans dérive, alimenté par le prix réel et la
// volatilité réalisée de l'actif.
//
//   P(S_T > K) = Φ( ( ln(S/K) − σ²T/2 ) / ( σ√T ) )
//
// Sans dérive (μ = 0) : le modèle ne parie sur aucune direction,
// il ne fait que mesurer la distance au seuil rapportée à
// l'amplitude habituelle des mouvements. Le prix bouge → la
// probabilité bouge, en direct, sans appel réseau supplémentaire.
//
// Fonctions pures, sans dépendance serveur : le serveur construit
// la liste, le client recalcule à chaque tick de prix.
// ─────────────────────────────────────────────────────────────

import type { Asset, AssetClass } from "@/lib/types";

export interface Horizon {
  key: string;
  label: string;
  hours: number;
}

export const HORIZONS: Horizon[] = [
  { key: "24h", label: "24 h", hours: 24 },
  { key: "7j", label: "7 jours", hours: 24 * 7 },
  { key: "30j", label: "30 jours", hours: 24 * 30 },
];

export interface PredictionMarket {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  assetClass: AssetClass;
  question: string;
  direction: "above" | "below";
  strike: number;
  horizonKey: string;
  horizonLabel: string;
  deadline: number; // epoch ms
  /** Prix de référence au moment du calcul serveur. */
  price: number;
  /** Volatilité annualisée (%) utilisée par le modèle. */
  volatility: number;
  /** Probabilité « oui », 0..100. */
  probability: number;
  /** Écart au seuil, en % du prix. */
  distancePct: number;
  /** Amplitude attendue sur l'horizon (± en % du prix). */
  expectedMovePct: number;
}

// ── Loi normale centrée réduite (Abramowitz & Stegun 7.1.26) ──
export function normalCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

/**
 * Probabilité que le cours franchisse `strike` avant l'échéance,
 * pour la direction demandée. Recalculable à chaque tick.
 */
export function probabilityOf(
  price: number,
  strike: number,
  volatilityPct: number,
  hours: number,
  direction: "above" | "below",
): number {
  if (!(price > 0) || !(strike > 0) || !(hours > 0)) return 50;
  const sigma = Math.max(0.05, Math.min(3, volatilityPct / 100));
  const t = hours / (24 * 365);
  const denom = sigma * Math.sqrt(t);
  if (denom <= 0) return direction === "above" ? (price > strike ? 100 : 0) : price < strike ? 100 : 0;
  const d = (Math.log(price / strike) - (sigma * sigma * t) / 2) / denom;
  const above = normalCdf(d) * 100;
  const p = direction === "above" ? above : 100 - above;
  return Math.max(0.5, Math.min(99.5, p));
}

/** Amplitude attendue (1 écart-type) sur l'horizon, en % du prix. */
export function expectedMovePct(volatilityPct: number, hours: number): number {
  const sigma = Math.max(0.05, Math.min(3, volatilityPct / 100));
  return sigma * Math.sqrt(hours / (24 * 365)) * 100;
}

/**
 * Palier « psychologique » le plus proche au-dessus / en dessous du cours
 * (80 000 $ pour un BTC à 79 620, 1,50 $ pour un XRP à 1,41).
 * C'est ce qui donne des questions crédibles — et des probabilités
 * naturellement variées, de l'évidence au pari long, comme sur Kalshi.
 */
export function roundLevel(price: number, direction: "above" | "below", index = 0): number {
  if (!(price > 0)) return price;
  const magnitude = Math.pow(10, Math.floor(Math.log10(price)));
  const step = magnitude / 2;
  const base =
    direction === "above"
      ? Math.floor(price / step) * step + step * (index + 1)
      : Math.ceil(price / step) * step - step * (index + 1);
  return Number(base.toPrecision(12));
}

function formatStrike(value: number, assetClass: AssetClass): string {
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : value >= 1 ? 2 : 4;
  const n = value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return assetClass === "index" ? n : `${n} $`;
}

/** Construit les questions d'un actif : 1 seuil au-dessus, 1 en dessous, par horizon. */
export function marketsForAsset(asset: Asset, now: number): PredictionMarket[] {
  const out: PredictionMarket[] = [];
  const vol = Number.isFinite(asset.volatility) && asset.volatility > 0 ? asset.volatility : 40;

  for (const h of HORIZONS) {
    const em = expectedMovePct(vol, h.hours);

    // Échelle de seuils autour du cours, comme les paliers d'un même
    // événement sur Kalshi : un seuil sous le cours (question de maintien,
    // probabilité > 50 %) et deux au-dessus (cassures, probabilité < 50 %).
    // Les questions restent distinctes — pas l'endroit et son envers.
    const strikes = [
      roundLevel(asset.price, "below", 0),
      roundLevel(asset.price, "above", 0),
      roundLevel(asset.price, "above", 1),
    ];

    for (const strike of strikes) {
      if (!(strike > 0) || strike === asset.price) continue;
      const holding = strike < asset.price;

      out.push({
        id: `${asset.symbol}-${h.key}-above-${strike}`,
        symbol: asset.symbol,
        name: asset.name,
        image: asset.image,
        assetClass: asset.class,
        question: holding
          ? `${asset.symbol} toujours au-dessus de ${formatStrike(strike, asset.class)} dans ${h.label} ?`
          : `${asset.symbol} au-dessus de ${formatStrike(strike, asset.class)} d'ici ${h.label} ?`,
        direction: "above",
        strike,
        horizonKey: h.key,
        horizonLabel: h.label,
        deadline: now + h.hours * 3600_000,
        price: asset.price,
        volatility: vol,
        probability: probabilityOf(asset.price, strike, vol, h.hours, "above"),
        distancePct: ((strike - asset.price) / asset.price) * 100,
        expectedMovePct: em,
      });
    }
  }
  return out;
}

/** Heures restantes avant échéance (pour le recalcul côté client). */
export function hoursLeft(deadline: number, now: number): number {
  return Math.max(0.25, (deadline - now) / 3600_000);
}

// Symboles d'indices / matières premières que des memecoins usurpent sur
// CoinGecko (« SPX » = SPX6900). Sans ce garde-fou, le S&P 500 se retrouve
// coté 0,60 $ avec 146 % de volatilité.
const RESERVED_SYMBOLS = new Set(["SPX", "NDX", "DJI", "DAX", "VIX", "XAU", "XAG", "WTI", "NG", "HG"]);

const STABLECOINS = new Set([
  "USDT", "USDC", "DAI", "USDE", "FDUSD", "TUSD", "USDS", "PYUSD",
  "BUSD", "USDD", "GUSD", "USDP", "RLUSD", "USD1",
]);

/** Un stablecoin ne produit aucune question intéressante. */
export function isStablecoin(asset: Asset): boolean {
  if (STABLECOINS.has(asset.symbol)) return true;
  return Math.abs(asset.price - 1) < 0.02 && asset.volatility < 8;
}

/** Sélection des actifs mis en avant sur le board. */
export function pickBoardAssets(assets: Asset[], maxCrypto = 6): Asset[] {
  const crypto = assets
    .filter(
      (a) => a.class === "crypto" && !isStablecoin(a) && !RESERVED_SYMBOLS.has(a.symbol),
    )
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .slice(0, maxCrypto);
  const others = assets.filter(
    (a) => a.class !== "crypto" && ["SPX", "NDX", "XAU", "WTI"].includes(a.symbol),
  );
  return [...crypto, ...others];
}
