// ─────────────────────────────────────────────────────────────
// AI Trading Assistant — intent-based structured responder (simulated)
//
// Maps a natural-language question to structured, honest answers built
// from the same analysis engine. In production this becomes an LLM call
// grounded on the same structured market data. It never claims certainty.
// ─────────────────────────────────────────────────────────────

import { MOCK_ASSETS, MOCK_ASSET_MAP } from "@/lib/market-data/mock-assets";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { formatPrice, formatPct } from "@/lib/utils";

export interface AssistantBlock {
  heading?: string;
  bullets?: string[];
  text?: string;
}

export interface AssistantAnswer {
  blocks: AssistantBlock[];
  disclaimer: boolean;
  relatedSymbols: string[];
}

function findSymbols(q: string): string[] {
  const upper = q.toUpperCase();
  const bySym = MOCK_ASSETS.filter((a) => upper.includes(a.symbol));
  const byName = MOCK_ASSETS.filter((a) => q.toLowerCase().includes(a.name.toLowerCase()));
  const aliases: Record<string, string> = {
    BITCOIN: "BTC", ETHEREUM: "ETH", NASDAQ: "NDX", "S&P": "SPX", SP500: "SPX",
    OR: "XAU", GOLD: "XAU", ARGENT: "XAG", PÉTROLE: "WTI", PETROLE: "WTI", OIL: "WTI",
    DOW: "DJI", SILVER: "XAG",
  };
  const byAlias = Object.entries(aliases)
    .filter(([k]) => upper.includes(k))
    .map(([, v]) => MOCK_ASSET_MAP[v])
    .filter(Boolean);
  const all = [...bySym, ...byName, ...byAlias];
  return Array.from(new Set(all.map((a) => a.symbol)));
}

export function answerQuestion(question: string): AssistantAnswer {
  const symbols = findSymbols(question);
  const q = question.toLowerCase();

  // Comparison
  if (symbols.length >= 2 && (q.includes("compar") || q.includes("vs") || q.includes("ou "))) {
    const [x, y] = symbols.map((s) => MOCK_ASSET_MAP[s]);
    return {
      relatedSymbols: [x.symbol, y.symbol],
      disclaimer: true,
      blocks: [
        { text: `Comparaison entre **${x.name} (${x.symbol})** et **${y.name} (${y.symbol})** sur les métriques clés :` },
        {
          heading: `${x.symbol}`,
          bullets: [
            `Prix : ${formatPrice(x.price)} · 24h : ${formatPct(x.changePct24h)} · 7j : ${formatPct(x.changePct7d)}`,
            `Tendance : ${x.trendStrength}/100 · Momentum : ${x.momentum} · RSI : ${x.rsi.toFixed(0)}`,
            `Volatilité : ${x.volatility.toFixed(0)}% · Drawdown : ${formatPct(x.drawdown)}`,
          ],
        },
        {
          heading: `${y.symbol}`,
          bullets: [
            `Prix : ${formatPrice(y.price)} · 24h : ${formatPct(y.changePct24h)} · 7j : ${formatPct(y.changePct7d)}`,
            `Tendance : ${y.trendStrength}/100 · Momentum : ${y.momentum} · RSI : ${y.rsi.toFixed(0)}`,
            `Volatilité : ${y.volatility.toFixed(0)}% · Drawdown : ${formatPct(y.drawdown)}`,
          ],
        },
        {
          heading: "Lecture",
          text: `${x.trendStrength > y.trendStrength ? x.symbol : y.symbol} affiche la tendance la plus forte, tandis que ${x.volatility > y.volatility ? x.symbol : y.symbol} est le plus volatil. Le choix dépend de votre horizon et de votre tolérance au risque — ceci n'est pas une recommandation.`,
        },
      ],
    };
  }

  // Single asset — "pourquoi ça baisse/monte", "niveaux", "scénarios"
  if (symbols.length >= 1) {
    const a = MOCK_ASSET_MAP[symbols[0]];
    const an = analyzeAsset(a);

    if (q.includes("niveau") || q.includes("support") || q.includes("résistance") || q.includes("resistance")) {
      return {
        relatedSymbols: [a.symbol],
        disclaimer: true,
        blocks: [
          { text: `Niveaux clés identifiés sur **${a.name} (${a.symbol})**, prix actuel ${formatPrice(a.price)} :` },
          { heading: "Résistances", bullets: an.keyLevels.filter((l) => l.type === "resistance").map((l) => `${formatPrice(l.price)} — ${l.note}`) },
          { heading: "Supports", bullets: an.keyLevels.filter((l) => l.type === "support").map((l) => `${formatPrice(l.price)} — ${l.note}`) },
          { text: "La réaction du prix à ces zones déterminera le scénario dominant. Rien n'est garanti." },
        ],
      };
    }

    if (q.includes("scénario") || q.includes("scenario") || q.includes("surveiller")) {
      return {
        relatedSymbols: [a.symbol],
        disclaimer: true,
        blocks: [
          { text: `Scénarios à surveiller sur **${a.symbol}** (ordonnés par pertinence) :` },
          ...an.scenarios.map((s) => ({
            heading: s.title,
            bullets: [
              `Conditions : ${s.conditions[0]}`,
              `Niveaux : ${s.watchLevels.join(", ")}`,
              `Invalidation : ${s.invalidation}`,
            ],
          })),
        ],
      };
    }

    // Default: why up/down / general read
    const dir = a.changePct24h >= 0 ? "en hausse" : "en baisse";
    return {
      relatedSymbols: [a.symbol],
      disclaimer: true,
      blocks: [
        { text: `**${a.name} (${a.symbol})** est actuellement ${dir} de ${formatPct(a.changePct24h)} sur 24h. Voici la lecture structurée :` },
        {
          heading: "Données observées",
          bullets: an.observed.slice(0, 4).map((o) => `${o.label} : ${o.value}`),
        },
        { heading: "Interprétation", text: an.context },
        { heading: "Momentum & volatilité", text: `${an.momentum.note} ${an.volatility.note}` },
        { heading: "Synthèse", text: an.summary },
      ],
    };
  }

  // No asset detected — guidance
  return {
    relatedSymbols: [],
    disclaimer: true,
    blocks: [
      { text: "Je peux analyser un actif, comparer deux actifs, détailler des niveaux clés ou lister des scénarios à surveiller." },
      {
        heading: "Essayez par exemple",
        bullets: [
          "Pourquoi le BTC bouge aujourd'hui ?",
          "Quels sont les niveaux importants sur le Nasdaq (NDX) ?",
          "Compare BTC et ETH",
          "Quels scénarios surveiller sur l'or (XAU) ?",
        ],
      },
    ],
  };
}

export const SUGGESTED_QUESTIONS = [
  "Pourquoi le BTC bouge aujourd'hui ?",
  "Quels sont les niveaux importants sur le NDX ?",
  "Compare BTC et ETH",
  "Quels scénarios surveiller sur XAU ?",
];
