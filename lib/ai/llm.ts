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
import { provider } from "@/lib/market-data/provider";
import { captureError } from "@/lib/observability";

export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * `live` dit si le contenu vient VRAIMENT du modèle, pas si la clé existe.
 *
 * La présence d'une clé ne garantit rien : modèle inconnu, quota épuisé,
 * schéma refusé → on replie sur le moteur simulé. Afficher « IA en direct »
 * dans ce cas ferait payer un abonné pour une réponse générée localement.
 */
export interface LlmResult<T> {
  value: T;
  live: boolean;
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

type JsonSchema = Record<string, unknown>;

async function callJson<T>(system: string, user: string, schema: JsonSchema): Promise<T> {
  const res = await client().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system,
    // Réponse contrainte par le schéma : le modèle ne peut pas renvoyer
    // autre chose que la forme attendue par l'application.
    output_config: {
      format: { type: "json_schema", schema },
      // Effort réduit plutôt que réflexion désactivée : sur Opus 5,
      // couper la réflexion fait parfois fuiter des balises internes
      // dans le texte — ce qui casserait le JSON.
      effort: "low",
    },
    messages: [{ role: "user", content: user }],
  });

  if (res.parsed_output) return res.parsed_output as T;

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Réponse LLM vide");
  return JSON.parse(block.text) as T;
}

/**
 * Trace la cause d'un repli sur le moteur simulé.
 *
 * Ce repli est invisible pour le client : il reçoit une analyse, elle est
 * juste beaucoup moins bonne — alors qu'il paie pour l'IA. Sans alerte,
 * une clé expirée peut dégrader le produit pendant des semaines.
 */
function logLlmFailure(where: string, error: unknown) {
  captureError(where === "assistant" ? "ai.assistant" : "ai.analysis", error, { where });
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

export async function llmAnalyzeAsset(asset: Asset): Promise<LlmResult<AiAnalysis>> {
  // Deterministic base carries the exact numeric fields (levels, observed…).
  const base = analyzeAsset(asset);
  if (!isLlmEnabled()) return { value: base, live: false };

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

    const value: AiAnalysis = {
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
    return { value, live: true };
  } catch (error) {
    // Panne, quota, schéma refusé → repli déterministe, cause tracée.
    logLlmFailure(`analyse ${asset.symbol}`, error);
    return { value: base, live: false };
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

export async function llmAssistant(question: string): Promise<LlmResult<AssistantAnswer>> {
  if (!isLlmEnabled()) return { value: answerQuestion(question), live: false };

  try {
    // L'assistant raisonnait sur le jeu de données SIMULÉ, même quand la
    // clé était présente : il citait un BTC figé à 64 820 $. Il travaille
    // désormais sur les cours réels, comme le reste de l'application.
    const snapshot = await marketSnapshot(question);
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
    if (!answer.blocks?.length) return { value: answerQuestion(question), live: false };
    return { value: { ...answer, disclaimer: true }, live: true };
  } catch (error) {
    logLlmFailure("assistant", error);
    return { value: answerQuestion(question), live: false };
  }
}

/**
 * Photo du marché envoyée au modèle : les actifs cités dans la question,
 * puis les plus gros du marché. Borné, sinon les 250 cryptos suivies
 * feraient exploser le contexte à chaque question.
 */
async function marketSnapshot(question: string) {
  const assets = await provider.listAssets();
  const asked = question.toUpperCase();

  const cited = assets.filter(
    (a) => asked.includes(a.symbol) || asked.includes(a.name.toUpperCase()),
  );
  const majors = assets
    .filter((a) => a.class !== "crypto")
    .concat(
      assets
        .filter((a) => a.class === "crypto")
        .sort((x, y) => (y.marketCap ?? 0) - (x.marketCap ?? 0))
        .slice(0, 20),
    );

  const seen = new Set<string>();
  return [...cited, ...majors]
    .filter((a) => (seen.has(a.symbol) ? false : seen.add(a.symbol)))
    .slice(0, 40)
    .map((a) => ({
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
}
