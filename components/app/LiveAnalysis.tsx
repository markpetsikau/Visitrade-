"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Lock, ArrowRight, Unlock } from "lucide-react";
import type { AiAnalysis } from "@/lib/types";
import { AiAnalysisPanel } from "@/components/app/AiAnalysisPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useMe } from "@/components/app/useMe";
import { hasFeature, FREE_MONTHLY_ANALYSES } from "@/lib/plans";
import { cn } from "@/lib/utils";

const QUOTA_KEY = "visitrade_free_analyses";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface QuotaState {
  month: string;
  symbols: string[];
}

function readQuota(): QuotaState {
  if (typeof window === "undefined") return { month: currentMonth(), symbols: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(QUOTA_KEY) || "{}");
    if (raw.month === currentMonth() && Array.isArray(raw.symbols)) return raw;
  } catch {
    /* ignore */
  }
  return { month: currentMonth(), symbols: [] };
}

export function LiveAnalysis({
  symbol,
  initial,
}: {
  symbol: string;
  initial: AiAnalysis;
}) {
  const me = useMe();
  const [analysis, setAnalysis] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  useEffect(() => setQuota(readQuota()), []);

  const isPro = hasFeature(me?.plan, "fullAnalysis");

  const regenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
      if (typeof data.live === "boolean") setLive(data.live);
    } catch {
      /* keep current */
    } finally {
      setLoading(false);
    }
  };

  // Loading state (avoid flashing locked/unlocked)
  if (!me || quota === null) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-raised/40" />;
  }

  // ── Pro / Elite : full analysis, with live regeneration ──
  if (isPro) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-end gap-2">
          {live === true && <Badge tone="brand">IA en direct disponible</Badge>}
          {live === false && <Badge tone="warn">IA simulée</Badge>}
          <Button variant="secondary" size="sm" onClick={regenerate}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? "Analyse en cours…" : live ? "Régénérer avec l'IA" : "Régénérer"}
          </Button>
        </div>
        <div className={cn(loading && "pointer-events-none opacity-60 transition-opacity")}>
          <AiAnalysisPanel analysis={analysis} />
        </div>
      </div>
    );
  }

  // ── Free : teaser + 1 full analysis / month ──
  const unlockedForThis = quota.symbols.includes(symbol);
  const remaining = Math.max(0, FREE_MONTHLY_ANALYSES - quota.symbols.length);

  if (unlockedForThis) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-end">
          <Badge tone="brand">
            <Unlock className="h-3 w-3" /> Analyse débloquée · 1/mois (Free)
          </Badge>
        </div>
        <AiAnalysisPanel analysis={analysis} />
      </div>
    );
  }

  const unlock = () => {
    if (remaining <= 0) return;
    const next = { month: currentMonth(), symbols: [...quota.symbols, symbol] };
    localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
    setQuota(next);
  };

  return (
    <div>
      {/* Partial teaser: context + trend only */}
      <AiAnalysisPanel analysis={analysis} teaser />

      {/* Unlock / paywall */}
      <div className="mt-4 rounded-2xl border border-brand/25 bg-brand/[0.05] p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand/12 text-brand">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-ink">
          Analyse complète, niveaux clés, momentum, volatilité, risques & synthèse
        </h3>

        {remaining > 0 ? (
          <>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
              Le plan Free inclut <span className="font-medium text-ink">1 analyse complète par mois</span>.
              Débloquez-la sur l'actif de votre choix.
            </p>
            <button
              onClick={unlock}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
            >
              <Unlock className="h-4 w-4" />
              Débloquer l'analyse complète de {symbol}
            </button>
            <p className="mt-2 text-xs text-ink-faint">
              Il vous reste {remaining} analyse{remaining > 1 ? "s" : ""} ce mois-ci.
            </p>
          </>
        ) : (
          <>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
              Vous avez utilisé votre analyse complète gratuite du mois
              {quota.symbols.length > 0 ? ` (${quota.symbols.join(", ")})` : ""}.
              Passez au Pro pour des analyses complètes illimitées.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
            >
              <Sparkles className="h-4 w-4" /> Passer au Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
