import Link from "next/link";
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Database,
  Layers,
  Cpu,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { HeroDashboard } from "@/components/marketing/HeroDashboard";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FaqList } from "@/components/marketing/FaqList";
import { FAQ_ITEMS } from "@/lib/faq";
import { FEATURES } from "@/lib/features";
import { Disclaimer } from "@/components/ui/Disclaimer";

const testimonials = [
  { name: "Léa M.", role: "Swing trader crypto", quote: "Je comprends enfin le contexte d'un actif en 30 secondes au lieu d'une heure de graphiques." },
  { name: "Thomas R.", role: "Développeur & investisseur", quote: "Les scénarios séparent clairement ce qui est observé de ce qui est interprété. C'est honnête, ça change tout." },
  { name: "Amine B.", role: "Day trader indices", quote: "Le scanner me sort les configurations qui m'intéressent sans que je passe la matinée à filtrer." },
  { name: "Sofia D.", role: "Trader débutante", quote: "L'assistant IA m'explique le 'pourquoi' d'un mouvement sans jargon. J'apprends en l'utilisant." },
  { name: "Karim L.", role: "Analyste amateur", quote: "Les niveaux clés et l'invalidation de chaque scénario sont exactement ce que je regardais à la main." },
  { name: "Nina P.", role: "Investisseuse long terme", quote: "Enfin un outil qui ne me promet pas la lune. Juste des données claires pour décider." },
];

const steps = [
  { icon: Database, title: "1 · Données de marché", text: "Les données (prix, volume, volatilité, historique) sont agrégées et normalisées via une couche unique." },
  { icon: Layers, title: "2 · Analyse technique & statistique", text: "Tendance, momentum, niveaux et ratios sont calculés et structurés — pas devinés." },
  { icon: Cpu, title: "3 · Moteur IA", text: "L'IA reçoit ces données structurées et produit une synthèse organisée et compréhensible." },
  { icon: Sparkles, title: "4 · Scénarios & décision", text: "Trois scénarios avec niveaux et invalidation vous aident à préparer vos décisions." },
];

export default function LandingPage() {
  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-aurora">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1.1fr]">
            <div className="animate-fade-up">
              <Badge tone="brand" className="mb-5">
                <Sparkles className="h-3 w-3" />
                Analyse de marché assistée par IA
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
                L'intelligence du marché,
                <br />
                <span className="text-gradient-brand">réunie au même endroit.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
                Analysez n'importe quel actif, explorez plusieurs scénarios et
                prenez des décisions plus claires — grâce aux données et à l'IA.
                Pas de promesses de gains, juste une meilleure compréhension.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/signup" size="lg">
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/how-it-works" variant="outline" size="lg">
                  <Play className="h-4 w-4" />
                  Découvrir VISITRADE
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand" /> Sans carte bancaire
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand" /> Crypto · Indices · Matières premières
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand" /> Outil d'aide à la décision
                </span>
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:120ms]">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── DATA SCALE STRIP ───────────── */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4">
          {[
            { k: "18+", v: "actifs couverts" },
            { k: "3", v: "classes d'actifs" },
            { k: "10+", v: "indicateurs par analyse" },
            { k: "3", v: "scénarios par actif" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-2xl font-bold text-ink sm:text-3xl">{s.k}</div>
              <div className="mt-1 text-xs text-ink-muted">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand" className="mb-4">Fonctionnalités</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Tout ce qu'il faut pour comprendre le marché
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Une suite d'outils cohérente, de l'analyse brute à la décision éclairée.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-2xl border border-border bg-surface-raised/50 p-6 transition-all duration-200 hover:border-brand/30 hover:bg-surface-hover"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand/15">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm font-medium text-brand/90">{f.tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {f.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-4">Comment ça marche</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              De la donnée brute au scénario clair
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              L'IA reçoit des données <span className="text-ink">structurées</span>, pas un simple prompt. Le résultat est organisé et vérifiable.
            </p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-surface-raised/50 p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.text}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-10 hidden h-5 w-5 text-border-strong md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── SCENARIOS SHOWCASE ───────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="brand" className="mb-4">Scénarios de marché</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Le marché n'a pas un seul avenir.
              <br />
              <span className="text-ink-muted">Préparez-les tous.</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Pour chaque actif, VISITRADE construit trois scénarios — haussier,
              baissier, neutre — avec leurs conditions, les niveaux à surveiller
              et surtout le seuil d'<span className="text-ink">invalidation</span>.
              Vous savez quand un scénario n'est plus valable.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Conditions nécessaires à chaque scénario",
                "Niveaux clés & zones à surveiller",
                "Seuil d'invalidation clairement défini",
                "Facteurs favorables et défavorables",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-ink-muted">
                  <Check className="h-4 w-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
            <Button href="/scenarios" variant="outline" size="md" className="mt-8">
              Voir les scénarios <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3">
            {[
              { tone: "border-bull/30 bg-bull/[0.05]", dot: "bg-bull", label: "Scénario haussier", text: "Clôture acceptée au-dessus de la résistance proche, momentum positif maintenu.", inval: "Invalidé sous le support intraday." },
              { tone: "border-neutral/30 bg-neutral/[0.05]", dot: "bg-neutral", label: "Scénario neutre", text: "Oscillation entre support et résistance, volatilité en contraction.", inval: "Invalidé à la sortie d'une borne avec volume." },
              { tone: "border-bear/30 bg-bear/[0.05]", dot: "bg-bear", label: "Scénario baissier", text: "Perte du support proche, bascule du momentum en négatif.", inval: "Invalidé au-dessus de la résistance proche." },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-5 ${s.tone}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <span className="text-sm font-semibold text-ink">{s.label}</span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
                <p className="mt-2 text-xs text-ink-faint">
                  <span className="font-medium text-ink-muted">Invalidation :</span> {s.inval}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-4">Ils utilisent VISITRADE</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Conçu pour ceux qui veulent comprendre
            </h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-surface-raised/50 p-6">
                <blockquote className="text-sm leading-relaxed text-ink">
                  « {t.quote} »
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
                    {t.name.slice(0, 1)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ink">{t.name}</div>
                    <div className="text-xs text-ink-faint">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PRICING ───────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand" className="mb-4">Tarifs</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Un plan pour chaque niveau
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Commencez gratuitement. Passez au niveau supérieur quand vous en avez besoin.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards />
        </div>
        <Disclaimer className="mx-auto mt-8 max-w-2xl justify-center" />
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Questions fréquentes
            </h2>
          </div>
          <div className="mt-12">
            <FaqList items={FAQ_ITEMS.slice(0, 5)} />
          </div>
          <div className="mt-6 text-center">
            <Link href="/faq" className="text-sm font-medium text-brand hover:underline">
              Voir toutes les questions →
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-brand/25 bg-gradient-to-b from-brand/[0.08] to-surface-raised/30 p-10 shadow-glow sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Prêt à voir le marché plus clairement ?
            </h2>
            <p className="mt-4 text-lg text-ink-muted">
              Créez votre compte gratuit et lancez votre première analyse en moins d'une minute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/signup" size="lg">
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/pricing" variant="outline" size="lg">
                Voir les tarifs
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
