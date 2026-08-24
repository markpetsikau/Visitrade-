import {
  BookOpenText,
  Plus,
  Target,
  Percent,
  Sigma,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PlanGate } from "@/components/app/PlanGate";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { Disclaimer, MockDataTag } from "@/components/ui/Disclaimer";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Journal — VISITRADE" };

type JournalEntry = {
  date: string;
  symbol: string;
  side: "long" | "short";
  entry: number;
  exit: number;
  result: "win" | "loss" | "be";
  rMultiple: number;
  note: string;
};

// Brand-new account: no trades logged yet.
const ENTRIES: JournalEntry[] = [];

const R_TARGET = "1R = risque initial par trade";

export default function JournalPage() {
  const total = ENTRIES.length;
  const wins = ENTRIES.filter((e) => e.result === "win").length;
  const decisive = ENTRIES.filter((e) => e.result !== "be").length;
  const winRate = decisive ? Math.round((wins / decisive) * 100) : 0;
  const avgR = total ? ENTRIES.reduce((s, e) => s + e.rMultiple, 0) / total : 0;
  const cumR = ENTRIES.reduce((s, e) => s + e.rMultiple, 0);
  const cumTone = cumR > 0 ? "bull" : cumR < 0 ? "bear" : "default";

  return (
    <>
      <PageHeader
        title="Journal de trading"
        subtitle="Consignez vos trades, vos décisions et vos émotions pour apprendre de chaque exécution et affiner votre process."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nouvelle entrée
          </Button>
        }
      />

      <PlanGate
        feature="journal"
        mode="blur"
        description="Le journal de trading avec statistiques de performance (taux de réussite, gain moyen en R, résultat cumulé) est réservé au plan Elite."
      >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Trades enregistrés"
          value={`${total}`}
          hint="Sur la période courante"
          tone="brand"
          icon={<BookOpenText className="h-4 w-4" />}
        />
        <StatCard
          label="Taux de réussite"
          value={`${winRate}%`}
          hint={`${wins} gagnants sur ${decisive} décisifs`}
          tone={winRate >= 50 ? "bull" : "bear"}
          icon={<Percent className="h-4 w-4" />}
        />
        <StatCard
          label="Gain moyen (R)"
          value={`${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R`}
          hint={R_TARGET}
          tone={avgR >= 0 ? "bull" : "bear"}
          icon={<Sigma className="h-4 w-4" />}
        />
        <StatCard
          label="Résultat cumulé"
          value={`${cumR >= 0 ? "+" : ""}${cumR.toFixed(1)}R`}
          hint="Somme des R sur la période"
          tone={cumTone as "bull" | "bear" | "default"}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Dernières entrées"
            subtitle="Historique de vos exécutions et notes"
            action={<MockDataTag />}
          />
          <div className="space-y-2 px-4 pb-4">
            {total === 0 && (
              <EmptyState
                icon={<BookOpenText className="h-5 w-5" />}
                title="Aucun trade enregistré"
                description="Consignez votre premier trade pour suivre votre performance, vos statistiques et apprendre de chaque décision."
              />
            )}
            {ENTRIES.map((e, i) => (
              <div
                key={`${e.symbol}-${e.date}-${i}`}
                className="rounded-xl border border-border bg-surface/40 p-4 transition-colors hover:bg-surface-hover/40"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <AssetIcon symbol={e.symbol} size={30} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {e.symbol}
                      </span>
                      <Badge tone={e.side === "long" ? "bull" : "bear"}>
                        {e.side === "long" ? "Long" : "Short"}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-ink-faint">{e.date}</div>
                  </div>

                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                        Entrée → Sortie
                      </div>
                      <div className="tnum text-sm text-ink-muted">
                        {formatPrice(e.entry)}{" "}
                        <span className="text-ink-faint">→</span>{" "}
                        {formatPrice(e.exit)}
                      </div>
                    </div>
                    <Badge
                      tone={
                        e.result === "win"
                          ? "bull"
                          : e.result === "loss"
                            ? "bear"
                            : "neutral"
                      }
                    >
                      {e.result === "win"
                        ? "Gagnant"
                        : e.result === "loss"
                          ? "Perdant"
                          : "Break-even"}{" "}
                      · {e.rMultiple >= 0 ? "+" : ""}
                      {e.rMultiple.toFixed(1)}R
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                  {e.note}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Nouvelle entrée"
            subtitle="Consignez votre dernier trade"
            action={<Target className="h-4 w-4 text-ink-faint" />}
          />
          <div className="space-y-3 px-4 pb-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Actif
              </label>
              <input
                type="text"
                placeholder="Ex. BTC, XAU, NDX…"
                className="h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Sens
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                defaultValue="long"
              >
                <option value="long">Long (achat)</option>
                <option value="short">Short (vente)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Prix entrée
                </label>
                <input
                  type="text"
                  placeholder="0.00"
                  className="tnum h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Prix sortie
                </label>
                <input
                  type="text"
                  placeholder="0.00"
                  className="tnum h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Résultat
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
                defaultValue="win"
              >
                <option value="win">Gagnant</option>
                <option value="loss">Perdant</option>
                <option value="be">Break-even</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Note
              </label>
              <textarea
                rows={3}
                placeholder="Setup, contexte, émotions, leçon retenue…"
                className="w-full rounded-lg border border-border-strong bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4" /> Ajouter au journal
            </Button>
            <p className="text-center text-[11px] text-ink-faint">
              Prototype — la sauvegarde arrive bientôt.
            </p>
          </div>
        </Card>
      </div>

      </PlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
