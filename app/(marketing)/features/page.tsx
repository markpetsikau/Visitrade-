import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { FEATURES } from "@/lib/features";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Fonctionnalités — VISITRADE" };

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="brand" className="mb-4">Fonctionnalités</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Une suite d'outils pensée pour la clarté
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Chaque fonctionnalité répond à un problème concret du trader. De l'analyse
          brute à la décision, tout est au même endroit.
        </p>
      </div>

      <div className="mt-16 space-y-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="grid items-center gap-8 rounded-2xl border border-border bg-surface-raised/40 p-8 md:grid-cols-2"
          >
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon name={f.icon} className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-ink">{f.title}</h2>
              <p className="mt-1 font-medium text-brand/90">{f.tagline}</p>
              <p className="mt-3 leading-relaxed text-ink-muted">{f.description}</p>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface/50 p-3">
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Problème résolu
                </span>
                <span className="text-sm text-ink-muted">{f.problem}</span>
              </div>
              <Button href={f.href} variant="outline" size="sm" className="mt-5">
                Explorer <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <div className="grid aspect-[4/3] place-items-center rounded-xl border border-border bg-surface/60 bg-grid">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <Icon name={f.icon} className="h-9 w-9" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-brand/25 bg-brand/[0.05] p-8 text-center">
        <h2 className="text-2xl font-semibold text-ink">Prêt à essayer ?</h2>
        <p className="mt-2 text-ink-muted">Toutes les fonctionnalités de base sont gratuites.</p>
        <Button href="/signup" size="lg" className="mt-6">
          Commencer gratuitement <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Disclaimer className="mx-auto mt-8 max-w-2xl justify-center" />
    </div>
  );
}
