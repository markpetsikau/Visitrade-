import { NextResponse } from "next/server";
import { llmAssistant, isLlmEnabled } from "@/lib/ai/llm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";
import { hasFeature } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Session + plan obligatoires : l'assistant est une fonction Pro,
    // et chaque question consomme un appel LLM facturé.
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    if (!hasFeature(session.plan, "assistant")) {
      return NextResponse.json(
        { error: "L'assistant IA est réservé au plan Pro.", upgrade: true },
        { status: 403 },
      );
    }

    // Garde-fou débit : 20 questions / minute / compte.
    const rl = rateLimit(`assistant:${session.email || clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const { question } = await req.json();
    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question manquante." }, { status: 400 });
    }
    const answer = await llmAssistant(question.slice(0, 500));
    return NextResponse.json({ answer, live: isLlmEnabled() });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// Indicateur « IA en direct » vs « IA simulée » — aucun contenu payant.
export async function GET() {
  return NextResponse.json({ live: isLlmEnabled() });
}
