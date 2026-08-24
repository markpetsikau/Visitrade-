import type { AiAnalysis } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { TrendBadge, Badge } from "@/components/ui/Badge";
import { Sparkles, Eye, Brain, Activity, Gauge, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiAnalysisPanel({
  analysis,
  teaser,
}: {
  analysis: AiAnalysis;
  teaser?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/12 text-brand">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Analyse IA · {analysis.symbol}</h2>
              <p className="text-xs text-ink-faint">Générée {analysis.generatedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendBadge trend={analysis.trend.direction} />
            <Badge tone="muted">
              Confiance : {analysis.trend.strength === "elevated" ? "élevée" : analysis.trend.strength === "moderate" ? "modérée" : "faible"}
            </Badge>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">{analysis.context}</p>
      </Card>

      {!teaser && (
      <>
      {/* Two columns: observed facts vs interpretation */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Observed */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-ink-muted" />
            <h3 className="text-sm font-semibold text-ink">Données observées</h3>
            <Badge tone="muted" className="ml-auto">Faits</Badge>
          </div>
          <dl className="space-y-2">
            {analysis.observed.map((o) => (
              <div key={o.label} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm last:border-0">
                <dt className="text-ink-muted">{o.label}</dt>
                <dd className="tnum font-medium text-ink">{o.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Interpretation */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold text-ink">Interprétation</h3>
            <Badge tone="brand" className="ml-auto">Analyse</Badge>
          </div>
          <div className="space-y-3">
            <Read icon={<Activity className="h-3.5 w-3.5" />} label="Tendance" note={analysis.trend.note} />
            <Read icon={<Gauge className="h-3.5 w-3.5" />} label={`Momentum · ${analysis.momentum.reading}`} note={analysis.momentum.note} />
            <Read icon={<Activity className="h-3.5 w-3.5" />} label={`Volatilité · ${analysis.volatility.reading}`} note={analysis.volatility.note} />
          </div>
        </Card>
      </div>

      {/* Key levels */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">Niveaux clés</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {analysis.keyLevels.map((l, i) => {
            const tone = l.type === "resistance" ? "bear" : l.type === "support" ? "bull" : "neutral";
            const label = l.type === "resistance" ? "Résistance" : l.type === "support" ? "Support" : "Pivot";
            return (
              <div key={i} className={cn("rounded-lg border p-2.5", tone === "bear" ? "border-bear/25" : tone === "bull" ? "border-bull/25" : "border-neutral/25")}>
                <div className={cn("text-[10px] font-medium uppercase", tone === "bear" ? "text-bear" : tone === "bull" ? "text-bull" : "text-neutral")}>{label}</div>
                <div className="tnum mt-0.5 text-sm font-semibold text-ink">
                  {l.price >= 1 ? l.price.toLocaleString("en-US") : l.price}
                </div>
                <div className="mt-0.5 text-[10px] leading-tight text-ink-faint">{l.note}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Risk factors */}
      <Card className="border-warn/20 bg-warn/[0.03] p-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-warn" />
          <h3 className="text-sm font-semibold text-ink">Facteurs de risque</h3>
        </div>
        <ul className="space-y-1.5">
          {analysis.riskFactors.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-ink-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warn" /> {r}
            </li>
          ))}
        </ul>
      </Card>

      {/* Summary */}
      <Card className="border-brand/25 bg-brand/[0.04] p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-ink">Synthèse IA</h3>
        </div>
        <p className="text-sm leading-relaxed text-ink">{analysis.summary}</p>
      </Card>
      </>
      )}
    </div>
  );
}

function Read({ icon, label, note }: { icon: React.ReactNode; label: string; note: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
        <span className="text-brand">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{note}</p>
    </div>
  );
}
