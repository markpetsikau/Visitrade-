"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Zap,
  TrendingUp,
  Timer,
  PiggyBank,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";
import { completeOnboardingAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 4;

const styles: { key: string; label: string; hint: string; icon: LucideIcon }[] = [
  { key: "day", label: "Day trading", hint: "Positions ouvertes et clôturées dans la journée", icon: Zap },
  { key: "swing", label: "Swing trading", hint: "Mouvements sur plusieurs jours à semaines", icon: TrendingUp },
  { key: "scalping", label: "Scalping", hint: "Micro-mouvements, exécution rapide", icon: Timer },
  { key: "invest", label: "Investissement", hint: "Horizon long terme, conviction de fond", icon: PiggyBank },
];

const markets = ["Crypto", "Actions", "Forex", "Indices", "Matières premières"];

const levels: { key: string; label: string; hint: string }[] = [
  { key: "debutant", label: "Débutant", hint: "Je découvre les marchés et le vocabulaire" },
  { key: "intermediaire", label: "Intermédiaire", hint: "Je trade régulièrement avec une méthode" },
  { key: "avance", label: "Avancé", hint: "Je gère mon risque et mes stratégies au quotidien" },
];

const stepTitles = [
  "Quel type de trading pratiquez-vous ?",
  "Quels marchés vous intéressent ?",
  "Quel est votre niveau ?",
  "Quels actifs suivre ?",
];

const stepSubtitles = [
  "Nous adaptons vos analyses et vos scénarios à votre style.",
  "Sélectionnez tout ce qui vous parle — vous pourrez ajuster plus tard.",
  "Aucune bonne réponse : cela nous aide à calibrer le ton des analyses.",
  "Constituez votre watchlist de départ. Tout reste modifiable ensuite.",
];

function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150",
        selected
          ? "border-brand/50 bg-brand/[0.08]"
          : "border-border bg-surface-raised/40 hover:border-border-strong hover:bg-surface-hover",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all duration-150",
          selected
            ? "border-brand bg-brand text-[#04110F]"
            : "border-border-strong text-transparent group-hover:border-brand/40",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [style, setStyle] = useState<string | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [assets, setAssets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboardingAction({
        tradingStyle: style ?? undefined,
        markets: selectedMarkets,
        level: level ?? undefined,
        watchlist: assets,
      });
    } catch {
      setSaving(false);
    }
  };

  const toggle = (
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const isLast = step === TOTAL_STEPS;
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-base px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />

      <Link
        href="/dashboard"
        className="absolute right-5 top-5 z-10 text-sm text-ink-faint transition-colors hover:text-ink-muted"
      >
        Passer
      </Link>

      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Étape {step} sur {TOTAL_STEPS}</span>
            <span className="text-ink-faint">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface-raised/40 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.6)] sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {stepTitles[step - 1]}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{stepSubtitles[step - 1]}</p>
          </div>

          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {styles.map((s) => (
                <OptionCard
                  key={s.key}
                  selected={style === s.key}
                  onClick={() => setStyle(s.key)}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors",
                      style === s.key
                        ? "bg-brand/15 text-brand"
                        : "bg-surface-raised text-ink-muted",
                    )}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{s.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-faint">
                      {s.hint}
                    </span>
                  </span>
                </OptionCard>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {markets.map((m) => (
                <OptionCard
                  key={m}
                  selected={selectedMarkets.includes(m)}
                  onClick={() => toggle(m, selectedMarkets, setSelectedMarkets)}
                >
                  <span className="text-sm font-medium text-ink">{m}</span>
                </OptionCard>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3">
              {levels.map((l) => (
                <OptionCard
                  key={l.key}
                  selected={level === l.key}
                  onClick={() => setLevel(l.key)}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{l.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-faint">
                      {l.hint}
                    </span>
                  </span>
                </OptionCard>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
              {MOCK_ASSETS.map((a) => {
                const selected = assets.includes(a.symbol);
                return (
                  <button
                    key={a.symbol}
                    type="button"
                    onClick={() => toggle(a.symbol, assets, setAssets)}
                    aria-pressed={selected}
                    className={cn(
                      "group relative flex flex-col items-start gap-2.5 rounded-xl border p-3 text-left transition-all duration-150",
                      selected
                        ? "border-brand/50 bg-brand/[0.08]"
                        : "border-border bg-surface-raised/40 hover:border-border-strong hover:bg-surface-hover",
                    )}
                  >
                    <span className="flex w-full items-center gap-2">
                      <AssetIcon symbol={a.symbol} size={30} />
                      <span
                        className={cn(
                          "ml-auto grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition-all duration-150",
                          selected
                            ? "border-brand bg-brand text-[#04110F]"
                            : "border-border-strong text-transparent group-hover:border-brand/40",
                        )}
                        style={{ height: 18, width: 18 }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{a.symbol}</span>
                      <span className="block truncate text-xs text-ink-faint">{a.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            ) : (
              <span />
            )}

            {isLast ? (
              <Button onClick={finish}>
                {saving ? "Préparation…" : "Accéder au dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
          <Sparkles className="h-3.5 w-3.5 text-brand/70" />
          VISITRADE affine vos analyses à chaque étape. Un outil d'aide à la décision, pas de promesses.
        </p>
      </div>
    </div>
  );
}
