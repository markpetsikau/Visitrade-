import { NextResponse } from "next/server";
import { llmAssistant, isLlmEnabled } from "@/lib/ai/llm";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Garde-fou : 20 requêtes IA / minute / IP.
    const rl = rateLimit(`assistant:${clientIp(req)}`, 20, 60_000);
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

export async function GET() {
  return NextResponse.json({ live: isLlmEnabled() });
}
