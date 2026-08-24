// ─────────────────────────────────────────────────────────────
// Analysis engine — real technical analysis.
//
// Computes genuine indicators from the asset's price series (MA20/50,
// MACD, real swing-pivot support/resistance, trend structure, RSI,
// momentum) and produces a data-grounded reading that VARIES per asset:
// the narrative is built from which signals are actually active, not a
// fixed template.
//
// Structure: Observed (facts) → Interpretation → Key levels →
// 3 Scenarios (with real invalidation) → Risks → Summary.
// Analyse & scénarios — jamais de certitude ni de promesse de gain.
// ─────────────────────────────────────────────────────────────

import type { Asset, AiAnalysis, Trend, Scenario, KeyLevel } from "@/lib/types";
import { formatPrice, formatPct } from "@/lib/utils";
import { sma, macd, findLevels, trendStructure } from "@/lib/market-data/indicators";

interface Signal {
  label: string;
  state: "bull" | "bear" | "neutral";
}

interface Read {
  price: number;
  ma20: number | null;
  ma50: number | null;
  macdHist: number | null;
  structure: "haussière" | "baissière" | "range";
  r1: number;
  r2: number;
  s1: number;
  s2: number;
  realLevels: boolean;
  signals: Signal[];
  bull: number;
  bear: number;
  direction: Trend;
  strength: number; // 0..100
}

function analyze(a: Asset): Read {
  const series = a.series && a.series.length > 5 ? a.series : a.spark;
  const price = a.price;
  const ma20 = sma(series, 20);
  const ma50 = sma(series, 50);
  const m = macd(series);
  const structure = trendStructure(series);
  const levels = findLevels(series, price);

  const r1 = levels.resistances[0] ?? price * 1.03;
  const r2 = levels.resistances[1] ?? price * 1.06;
  const s1 = levels.supports[0] ?? price * 0.97;
  const s2 = levels.supports[1] ?? price * 0.94;
  const realLevels = levels.resistances.length > 0 || levels.supports.length > 0;

  const signals: Signal[] = [];
  const add = (label: string, state: Signal["state"]) => signals.push({ label, state });

  if (ma20 !== null)
    add(price > ma20 ? "Prix au-dessus de la MM20" : "Prix sous la MM20", price > ma20 ? "bull" : "bear");
  if (ma50 !== null)
    add(price > ma50 ? "Prix au-dessus de la MM50" : "Prix sous la MM50", price > ma50 ? "bull" : "bear");
  if (ma20 !== null && ma50 !== null)
    add(ma20 > ma50 ? "MM20 > MM50 (structure haussière)" : "MM20 < MM50 (structure baissière)", ma20 > ma50 ? "bull" : "bear");
  if (m) add(m.hist > 0 ? "MACD positif" : "MACD négatif", m.hist > 0 ? "bull" : "bear");
  add(`Structure ${structure}`, structure === "haussière" ? "bull" : structure === "baissière" ? "bear" : "neutral");
  add(a.momentum > 10 ? "Momentum positif" : a.momentum < -10 ? "Momentum négatif" : "Momentum plat", a.momentum > 10 ? "bull" : a.momentum < -10 ? "bear" : "neutral");
  if (a.rsi >= 70) add("RSI en surachat", "bear");
  else if (a.rsi <= 30) add("RSI en survente", "bull");

  const bull = signals.filter((s) => s.state === "bull").length;
  const bear = signals.filter((s) => s.state === "bear").length;
  const decisive = bull + bear;
  let direction: Trend = "neutral";
  if (bull - bear >= 2) direction = "bullish";
  else if (bear - bull >= 2) direction = "bearish";
  const strength = decisive === 0 ? 40 : Math.round((Math.abs(bull - bear) / decisive) * 60 + 40);

  return { price, ma20, ma50, macdHist: m?.hist ?? null, structure, r1, r2, s1, s2, realLevels, signals, bull, bear, direction, strength };
}

function scenarios(a: Asset, r: Read): Scenario[] {
  const fp = (v: number) => formatPrice(v);
  const bullFavored = r.direction === "bullish";
  const bearFavored = r.direction === "bearish";

  const bull: Scenario = {
    kind: "bullish",
    title: "Scénario haussier",
    probabilityLabel: bullFavored ? "Favorisé par les signaux" : "Conditionnel",
    conditions: [
      `Clôture acceptée au-dessus de ${fp(r.r1)}`,
      r.macdHist !== null && r.macdHist <= 0 ? "Repassage du MACD en positif" : "MACD qui reste positif",
      "Volume en soutien sur la cassure",
    ],
    watchLevels: [`${fp(r.r1)} puis ${fp(r.r2)}`],
    invalidation: `Clôture sous le support ${fp(r.s1)}`,
    favorable: (() => {
      const l = r.signals.filter((s) => s.state === "bull").map((s) => s.label);
      return (l.length ? l : ["Reprise de la demande sur support"]).slice(0, 3);
    })(),
    unfavorable: [a.rsi > 68 ? "RSI élevé, risque d'essoufflement" : "Résistance proche à absorber", "Contexte macro pouvant changer"],
  };
  const bear: Scenario = {
    kind: "bearish",
    title: "Scénario baissier",
    probabilityLabel: bearFavored ? "Favorisé par les signaux" : "Conditionnel",
    conditions: [
      `Perte et clôture sous ${fp(r.s1)}`,
      r.macdHist !== null && r.macdHist >= 0 ? "Bascule du MACD en négatif" : "MACD qui reste négatif",
      `Rejet sur la résistance ${fp(r.r1)}`,
    ],
    watchLevels: [`${fp(r.s1)} puis ${fp(r.s2)}`],
    invalidation: `Récupération au-dessus de ${fp(r.r1)}`,
    favorable: (() => {
      const l = r.signals.filter((s) => s.state === "bear").map((s) => s.label);
      return (l.length ? l : ["Pression vendeuse sous résistance"]).slice(0, 3);
    })(),
    unfavorable: [r.ma50 !== null && r.price > r.ma50 ? "Prix encore au-dessus de la MM50" : "Support proche identifié", "Rebond technique possible"],
  };
  const neutral: Scenario = {
    kind: "neutral",
    title: "Scénario neutre / range",
    probabilityLabel: r.direction === "neutral" ? "Favorisé par les signaux" : "Alternatif",
    conditions: [`Oscillation entre ${fp(r.s1)} et ${fp(r.r1)}`, "Signaux contradictoires, pas de catalyseur", "Volatilité en contraction"],
    watchLevels: [`Bornes ${fp(r.s1)} – ${fp(r.r1)}`],
    invalidation: "Sortie franche d'une borne avec volume",
    favorable: ["Marché en attente de direction", "Range exploitable entre les bornes"],
    unfavorable: ["Une cassure peut être brutale"],
  };

  if (bullFavored) return [bull, neutral, bear];
  if (bearFavored) return [bear, neutral, bull];
  return [neutral, bull, bear];
}

export function analyzeAsset(a: Asset): AiAnalysis {
  const r = analyze(a);
  const dirLabel = r.direction === "bullish" ? "haussière" : r.direction === "bearish" ? "baissière" : "neutre";
  const bullSignals = r.signals.filter((s) => s.state === "bull").map((s) => s.label.toLowerCase());
  const bearSignals = r.signals.filter((s) => s.state === "bear").map((s) => s.label.toLowerCase());

  const volReading = a.volatility > 60 ? "élevée" : a.volatility > 30 ? "modérée" : "contenue";
  const momReading = a.momentum > 25 ? "fort et positif" : a.momentum > 0 ? "légèrement positif" : a.momentum > -25 ? "légèrement négatif" : "fortement négatif";

  const observed: { label: string; value: string }[] = [
    { label: "Prix", value: formatPrice(a.price) },
    { label: "Variation 24h", value: formatPct(a.changePct24h) },
    { label: "Variation 7j", value: formatPct(a.changePct7d) },
    { label: "RSI (14)", value: a.rsi.toFixed(0) },
  ];
  if (r.ma20 !== null) observed.push({ label: "vs MM20", value: `${a.price >= r.ma20 ? "+" : ""}${(((a.price - r.ma20) / r.ma20) * 100).toFixed(1)}%` });
  if (r.ma50 !== null) observed.push({ label: "vs MM50", value: `${a.price >= r.ma50 ? "+" : ""}${(((a.price - r.ma50) / r.ma50) * 100).toFixed(1)}%` });
  if (r.macdHist !== null) observed.push({ label: "MACD", value: r.macdHist > 0 ? "positif" : "négatif" });
  observed.push({ label: "Volatilité", value: `${a.volatility.toFixed(0)}% (${volReading})` });
  observed.push({ label: "Drawdown vs plus-haut", value: formatPct(a.drawdown) });

  const keyLevels: KeyLevel[] = [
    { type: "resistance", price: r.r2, note: r.realLevels ? "Zone d'offre (pivot)" : "Résistance estimée" },
    { type: "resistance", price: r.r1, note: "Résistance la plus proche" },
    { type: "pivot", price: a.price, note: "Prix actuel" },
    { type: "support", price: r.s1, note: "Support le plus proche" },
    { type: "support", price: r.s2, note: r.realLevels ? "Zone de demande (pivot)" : "Support estimé" },
  ];

  const signalSummary = `${r.bull} signal${r.bull > 1 ? "aux" : ""} haussier${r.bull > 1 ? "s" : ""} contre ${r.bear} baissier${r.bear > 1 ? "s" : ""}`;

  return {
    symbol: a.symbol,
    generatedAt: "il y a quelques instants",
    observed,
    context: `${a.name} présente une lecture technique ${dirLabel} : ${signalSummary}. Sur 7 jours, ${formatPct(a.changePct7d)} avec une volatilité ${volReading}. Prix ${r.ma20 !== null ? (a.price >= r.ma20 ? "au-dessus" : "sous") + " de la MM20" : "sans MM20 disponible"}, à ${formatPct(a.drawdown)} du plus-haut.`,
    trend: {
      direction: r.direction,
      strength: r.strength > 65 ? "elevated" : r.strength > 50 ? "moderate" : "low",
      note:
        r.direction === "neutral"
          ? `Signaux contradictoires (${signalSummary}) — aucune direction dominante. Attendre une confirmation au-dessus de ${formatPrice(r.r1)} ou sous ${formatPrice(r.s1)}.`
          : `Biais ${dirLabel} appuyé par : ${(r.direction === "bullish" ? bullSignals : bearSignals).slice(0, 3).join(", ")}. Force estimée ${r.strength}/100.`,
    },
    momentum: {
      reading: momReading,
      note: `Momentum ${a.momentum}, RSI ${a.rsi.toFixed(0)}${r.macdHist !== null ? `, MACD ${r.macdHist > 0 ? "positif" : "négatif"}` : ""}. ${a.rsi > 70 ? "Surachat — prudence sur les poursuites." : a.rsi < 30 ? "Survente — rebond technique possible." : "Ni surachat ni survente marqués."}`,
    },
    volatility: {
      reading: volReading,
      note: `Volatilité ${volReading} (${a.volatility.toFixed(0)}%). ${a.volatility > 60 ? "Mouvements amples : adapter le dimensionnement au risque." : "Mouvements mesurés sauf catalyseur."}`,
    },
    keyLevels,
    scenarios: scenarios(a, r),
    riskFactors: [
      `Invalidation clé : le biais ${dirLabel} n'est plus valable ${r.direction === "bearish" ? `au-dessus de ${formatPrice(r.r1)}` : `sous ${formatPrice(r.s1)}`}.`,
      a.volatility > 60 ? "Volatilité élevée : risque de faux signaux et de mèches violentes." : "Un catalyseur macro/actualité peut modifier le contexte rapidement.",
      "Aide à la décision, pas une recommandation d'achat/vente. Les données peuvent évoluer.",
    ],
    summary: `${a.name} : lecture ${dirLabel} (${signalSummary}), momentum ${momReading}, volatilité ${volReading}. Niveaux à surveiller : ${formatPrice(r.s1)} en support, ${formatPrice(r.r1)} en résistance. Le scénario dominant se confirme à la cassure d'une de ces bornes — aucune issue n'est garantie, gérer le risque en priorité.`,
  };
}
