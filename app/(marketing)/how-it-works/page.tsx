import { Database, Layers, Cpu, GitBranch, Sparkles, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Comment ça marche — VISITRADE" };

const pipeline = [
  { icon: Database, title: "Données de marché", text: "Prix, volume, volatilité et historique sont agrégés via une couche de données unique (marketDataProvider), pensée pour brancher des fournisseurs reconnus." },
  { icon: Layers, title: "Traitement & statistiques", text: "Tendance, momentum, RSI, drawdown, niveaux clés et corrélations sont calculés et normalisés — des faits, pas des intuitions." },
  { icon: Cpu, title: "Moteur d'analyse IA", text: "L'IA reçoit ces données structurées et produit une synthèse organisée : contexte, tendance, momentum, volatilité, niveaux." },
  { icon: GitBranch, title: "Moteur de scénarios", text: "Trois scénarios (haussier, baissier, neutre) sont générés avec conditions, niveaux à surveiller et seuil d'invalidation." },
  { icon: Sparkles, title: "Dashboard VISITRADE", text: "Tout est présenté dans une interface claire : vous décidez, en gardant les risques et l'incertitude toujours visibles." },
];

const principles = [
  { t: "Données observées ≠ interprétation", d: "Chaque analyse sépare explicitement ce qui est mesuré de ce qui est déduit." },
  { t: "Toujours plusieurs scénarios", d: "Jamais une prédiction unique — le marché reste incertain par nature." },
  { t: "Un seuil d'invalidation clair", d: "Vous savez précisément quand une hypothèse n'est plus valable." },
  { t: "Le risque, toujours visible", d: "Facteurs de risque et avertissements accompagnent chaque analyse." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="brand" className="mb-4">Comment ça marche</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          De la donnée brute à la décision éclairée
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          VISITRADE ne « devine » pas. Il transforme des données structurées en
          une lecture claire du marché, en gardant l'incertitude visible.
        </p>
      </div>

      {/* pipeline */}
      <div className="mt-16 space-y-3">
        {pipeline.map((s, i) => (
          <div key={s.title} className="flex gap-5 rounded-2xl border border-border bg-surface-raised/40 p-6">
            <div className="flex flex-col items-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
                <s.icon className="h-5 w-5" />
              </div>
              {i < pipeline.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
            </div>
            <div className="pb-2">
              <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 leading-relaxed text-ink-muted">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* principles */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold text-ink">
          Nos principes d'analyse
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.t} className="rounded-2xl border border-border bg-surface-raised/40 p-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand" />
                <h3 className="font-semibold text-ink">{p.t}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Button href="/signup" size="lg">
          Lancer ma première analyse <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Disclaimer variant="banner" className="mx-auto mt-12 max-w-3xl" />
    </div>
  );
}
