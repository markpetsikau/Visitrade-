"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Lock, ArrowRight, Unlock } from "lucide-react";
import type { AiAnalysis } from "@/lib/types";
import { AiAnalysisPanel } from "@/components/app/AiAnalysisPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface QuotaView {
  symbols: string[];
  remaining: number;
  unlimited: boolean;
}

export function LiveAnalysis({
  symbol,
  initial,
  entitled,
  initialQuota,
}: {
  symbol: string;
  /** Analyse complète si `entitled`, sinon version amputée côté serveur. */
  initial: AiAnalysis;
  /** Droit d'accès calculé côté serveur (plan payant ou analyse déjà débloquée). */
  entitled: boolean;
  initialQuota: QuotaView;
}) {
  const [analysis, setAnalysis] = useState(initial);
  const [unlocked, setUnlocked] = useState(entitled);
  const [quota, setQuota] = useState<QuotaView>(initialQuota);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  // Récupère l'analyse complète auprès du serveur (qui revérifie le droit).
  const fetchAnalysis = async () => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analyse indisponible.");
    if (data.analysis) setAnalysis(data.analysis);
    if (typeof data.live === "boolean") setLive(data.live);
  };

  const regenerate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await fetchAnalysis();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse indisponible.");
    } finally {
      setLoading(false);
    }
  };

  // Free : consomme l'analyse du mois côté serveur, puis charge le contenu.
  const unlock = async () => {
    if (loading || quota.remaining <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuota({
          symbols: data.symbols ?? quota.symbols,
          remaining: data.remaining ?? 0,
          unlimited: Boolean(data.unlimited),
        });
        throw new Error(data.error || "Déblocage impossible.");
      }
      setQuota({
        symbols: data.symbols ?? [],
        remaining: data.remaining ?? 0,
        unlimited: Boolean(data.unlimited),
      });
      await fetchAnalysis();
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Déblocage impossible.");
    } finally {
      setLoading(false);
    }
  };

  // ── Accès complet : plan payant ou analyse débloquée ──
  if (unlocked) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          {!quota.unlimited && (
            <Badge tone="brand">
              <Unlock className="h-3 w-3" /> Analyse débloquée · 1/mois (Free)
            </Badge>
          )}
          {live === true && <Badge tone="brand">IA en direct disponible</Badge>}
          {live === false && <Badge tone="warn">IA simulée</Badge>}
          {quota.unlimited && (
            <Button variant="secondary" size="sm" onClick={regenerate}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              {loading ? "Analyse en cours…" : live ? "Régénérer avec l'IA" : "Régénérer"}
            </Button>
          )}
        </div>
        {error && <p className="mb-3 text-right text-xs text-warn">{error}</p>}
        <div className={cn(loading && "pointer-events-none opacity-60 transition-opacity")}>
          <AiAnalysisPanel analysis={analysis} />
        </div>
      </div>
    );
  }

  // ── Free : aperçu (contexte + tendance) + déblocage mensuel ──
  return (
    <div>
      <AiAnalysisPanel analysis={analysis} teaser />

      <div className="mt-4 rounded-2xl border border-brand/25 bg-brand/[0.05] p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand/12 text-brand">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-ink">
          Analyse complète, niveaux clés, momentum, volatilité, risques &amp; synthèse
        </h3>

        {quota.remaining > 0 ? (
          <>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
              Le plan Free inclut <span className="font-medium text-ink">1 analyse complète par mois</span>.
              Débloquez-la sur l&apos;actif de votre choix.
            </p>
            <button
              onClick={unlock}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright disabled:opacity-60"
            >
              <Unlock className="h-4 w-4" />
              {loading ? "Déblocage…" : `Débloquer l'analyse complète de ${symbol}`}
            </button>
            <p className="mt-2 text-xs text-ink-faint">
              Il vous reste {quota.remaining} analyse{quota.remaining > 1 ? "s" : ""} ce mois-ci.
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
        {error && <p className="mt-3 text-xs text-warn">{error}</p>}
      </div>
    </div>
  );
}
