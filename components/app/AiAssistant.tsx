"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User } from "lucide-react";
import { SUGGESTED_QUESTIONS, type AssistantAnswer } from "@/lib/ai/assistant";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface Msg {
  role: "user" | "assistant";
  text?: string;
  answer?: AssistantAnswer;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function AiAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Detect whether the live LLM is configured (shows the right badge).
  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (typeof data.live === "boolean") setLive(data.live);
      setMessages((m) => [...m, { role: "assistant", answer: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          answer: {
            blocks: [{ text: "Une erreur est survenue. Réessayez dans un instant." }],
            relatedSymbols: [],
            disclaimer: false,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col rounded-2xl border border-border bg-surface-raised/40">
      {/* status bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Sparkles className="h-3.5 w-3.5 text-brand" /> AI Trading Assistant
        </span>
        {live === true ? (
          <Badge tone="brand">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" /> IA en direct
          </Badge>
        ) : live === false ? (
          <Badge tone="warn">IA simulée</Badge>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand">
              <Sparkles className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink">Posez votre question</h3>
            <p className="mt-1 max-w-md text-sm text-ink-muted">
              Analysez un actif, comparez deux marchés ou explorez des scénarios.
              Les réponses sont structurées et n'affirment jamais de certitude.
            </p>
            <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand/40 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="flex max-w-[80%] items-start gap-2.5">
                <div className="rounded-2xl rounded-tr-sm bg-brand/15 px-4 py-2.5 text-sm text-ink">
                  {m.text}
                </div>
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-hover text-ink-muted">
                  <User className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[85%] space-y-3 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3">
                {m.answer!.blocks.map((b, j) => (
                  <div key={j}>
                    {b.heading && (
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                        {b.heading}
                      </div>
                    )}
                    {b.text && (
                      <p className="text-sm leading-relaxed text-ink-muted">{renderInline(b.text)}</p>
                    )}
                    {b.bullets && b.bullets.length > 0 && (
                      <ul className="space-y-1">
                        {b.bullets.map((x, k) => (
                          <li key={k} className="flex gap-2 text-sm text-ink-muted">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                            {renderInline(x)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {m.answer!.relatedSymbols.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.answer!.relatedSymbols.map((s) => (
                      <Link key={s} href={`/markets/${s}`}>
                        <Badge tone="brand">{s} →</Badge>
                      </Link>
                    ))}
                  </div>
                )}
                {m.answer!.disclaimer && (
                  <p className="border-t border-border pt-2 text-[11px] text-ink-faint">
                    Analyse à titre informatif — aucune garantie de résultat, pas un conseil en investissement.
                  </p>
                )}
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3.5">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ink-muted" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ink-muted [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ink-muted [animation-delay:400ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question…"
          disabled={loading}
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none disabled:opacity-60"
        />
        <Button type="submit" size="md" className="h-11 px-4">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
