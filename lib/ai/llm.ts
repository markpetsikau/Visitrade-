// ─────────────────────────────────────────────────────────────
// LLM layer — real Claude calls behind the same typed contracts.
//
// Architecture (per VISITRADE brief): the model receives STRUCTURED
// market data (from marketDataProvider), not a vague prompt, and returns
// STRUCTURED JSON validated against a schema. The rest of the app keeps
// consuming the exact same `AiAnalysis` / `AssistantAnswer` types.
//
// If ANTHROPIC_API_KEY is absent, callers fall back to the deterministic
// simulated engine — the prototype keeps working with zero config.
//
// Positioning is enforced in the system prompts: analysis & scenarios,
// never guarantees. No "gagnez à coup sûr".
// ─────────────────────────────────────────────────────────────

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Asset, AiAnalysis } from "@/lib/types";
import type { AssistantAnswer } from "@/lib/ai/assistant";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { answerQuestion } from "@/lib/ai/assistant";
import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";

export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

const MODEL = "claude-opus-5";

const POSITIONING = `Tu es le moteur d'analyse de VISITRADE, un SaaS d'aide à la décision pour le trading.
RÈGLES ABSOLUES :
- Tu produis une ANALYSE et des SCÉNARIOS, jamais une certitude ni une promesse de gain.
- Interdit : "gagnez à coup sûr", "prédiction parfaite", "100% de réussite", "l'IA sait où va le marché".
- Sépare clairement : données observées (faits) / interprétation / scénarios / hypothèses / risques.
- Ton : professionnel, clair, honnête, en français. Aucun conseil en investissement personnalisé.
- Tu reçois des données de marché structurées ; appuie ton analyse dessus, n'invente pas de chiffres.`;

async function callJson<T>(system: string, user: string, schema: object): Promise<T> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "disabled" },
    system,
    output_config: { format: { type: "json_schema", schema } } as never,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Empty LLM response");
  return JSON.parse(block.text) as T;
}

// ── Asset analysis: numbers stay deterministic, narrative comes from the LLM ──

interface AnalysisNarrative {
  context: string;
  trendNote: string;
  momentumReading: string;
  momentumNote: string;
  volatilityReading: string;
  volatilityNote: string;
  riskFactors: string[];
  summary: string;
}

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "context",
    "trendNote",
    "momentumReading",
    "momentumNote",
    "volatilityReading",
    "volatilityNote",
    "riskFactors",
    "summary",
  ],
  properties: {
    context: { type: "string" },
    trendNote: { type: "string" },
    momentumReading: { type: "string" },
    momentumNote: { type: "string" },
    volatilityReading: { type: "string" },
    volatilityNote: { type: "string" },
    riskFactors: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
};

export async function llmAnalyzeAsset(asset: Asset): Promise<AiAnalysis> {
  // Deterministic base carries the exact numeric fields (levels, observed…).
  const base = analyzeAsset(asset);
  if (!isLlmEnabled()) return base;

  try {
    const data = {
      symbol: asset.symbol,
      name: asset.name,
      class: asset.class,
      price: asset.price,
      changePct24h: asset.changePct24h,
      changePct7d: asset.changePct7d,
      volatility: asset.volatility,
      momentum: asset.momentum,
      trendStrength: asset.trendStrength,
      rsi: asset.rsi,
      drawdown: asset.drawdown,
      keyLevels: base.keyLevels,
    };
    const n = await callJson<AnalysisNarrative>(
      POSITIONING,
      `Analyse cet actif à partir de ces données de marché structurées et renvoie le JSON demandé.
Données : ${JSON.stringify(data)}

Consignes de rédaction :
- context : 2-3 phrases situant l'actif (structure, variation, volatilité, position vs plus-haut).
- trendNote : lecture de la tendance en t'appuyant sur trendStrength et momentum.
- momentumReading : 3-4 mots (ex. "fort et positif", "légèrement négatif").
- momentumNote : lecture momentum + RSI (surachat/survente le cas échéant).
- volatilityReading : un mot (contenue / modérée / élevée).
- volatilityNote : implication pour le dimensionnement du risque.
- riskFactors : 3 à 4 risques concrets, dont le rappel que ce n'est pas un conseil et que les données peuvent évoluer.
- summary : synthèse honnête en 2 phrases, sans garantie de résultat.`,
      ANALYSIS_SCHEMA,
    );

    return {
      ...base,
      context: n.context || base.context,
      trend: { ...base.trend, note: n.trendNote || base.trend.note },
      momentum: {
        reading: n.momentumReading || base.momentum.reading,
        note: n.momentumNote || base.momentum.note,
      },
      volatility: {
        reading: n.volatilityReading || base.volatility.reading,
        note: n.volatilityNote || base.volatility.note,
      },
      riskFactors: n.riskFactors?.length ? n.riskFactors : base.riskFactors,
      summary: n.summary || base.summary,
      generatedAt: "à l'instant (IA en direct)",
    };
  } catch {
    // Any error (no credit, network, schema) → deterministic fallback.
    return base;
  }
}

// ── Assistant: full structured answer from the LLM ──

const ASSISTANT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["blocks", "relatedSymbols", "disclaimer"],
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "text", "bullets"],
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
      },
    },
    relatedSymbols: { type: "array", items: { type: "string" } },
    disclaimer: { type: "boolean" },
  },
};

export async function llmAssistant(question: string): Promise<AssistantAnswer> {
  if (!isLlmEnabled()) return answerQuestion(question);

  try {
    // Ground the model on the current (mock) market snapshot.
    const snapshot = MOCK_ASSETS.map((a) => ({
      symbol: a.symbol,
      name: a.name,
      class: a.class,
      price: a.price,
      changePct24h: a.changePct24h,
      changePct7d: a.changePct7d,
      volatility: a.volatility,
      momentum: a.momentum,
      trendStrength: a.trendStrength,
      rsi: a.rsi,
    }));
    const answer = await callJson<AssistantAnswer>(
      POSITIONING,
      `Question de l'utilisateur : "${question}"

Snapshot du marché (données structurées) : ${JSON.stringify(snapshot)}

Réponds via le JSON demandé :
- blocks : segments de réponse. Chaque bloc a heading (titre court ou ""), text (paragraphe ou ""), bullets (liste ou []). Utilise **gras** avec des astérisques si utile.
- Sépare données observées / interprétation / synthèse quand c'est pertinent.
- relatedSymbols : les symboles concernés (ex. ["BTC","ETH"]).
- disclaimer : true.
- Si la question ne concerne pas un actif connu, propose des exemples de questions.
- Jamais de certitude ni de promesse de gain.`,
      ASSISTANT_SCHEMA,
    );
    if (!answer.blocks?.length) return answerQuestion(question);
    return { ...answer, disclaimer: true };
  } catch {
    return answerQuestion(question);
  }
}
