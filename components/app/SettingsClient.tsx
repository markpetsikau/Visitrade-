"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PLANS } from "@/lib/constants";
import { useMe, PLAN_LABEL, type Me } from "@/components/app/useMe";
import { signOutAction } from "@/lib/auth/actions";
import {
  User,
  CreditCard,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  Check,
  Sparkles,
  LogOut,
  Trash2,
} from "lucide-react";

const inputClass =
  "h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

const SECTIONS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "trading", label: "Préférences de trading", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "securite", label: "Sécurité", icon: ShieldCheck },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const MARKETS = ["Crypto", "Indices", "Matières premières", "Actions", "Forex"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20",
        checked
          ? "border-brand/50 bg-brand/80"
          : "border-border-strong bg-surface-raised"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-ink shadow transition-transform",
          checked ? "translate-x-6 bg-[#04110F]" : "translate-x-1 bg-ink-faint"
        )}
      />
    </button>
  );
}

export function SettingsClient() {
  const [active, setActive] = useState<SectionId>("profil");
  const me = useMe();

  const [markets, setMarkets] = useState<Record<string, boolean>>({
    Crypto: true,
    Indices: true,
    "Matières premières": false,
    Actions: false,
    Forex: false,
  });

  const [notifs, setNotifs] = useState({
    prix: true,
    analyses: true,
    scenarios: true,
    resume: false,
  });

  const proPlan = PLANS.find((p) => p.id === "pro");
  const elitePlan = PLANS.find((p) => p.id === "elite");
  const freePlan = PLANS.find((p) => p.id === "free");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Section nav */}
      <nav className="lg:sticky lg:top-6 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-raised text-ink"
                      : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-brand" : "text-ink-faint"
                    )}
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Panels */}
      <div className="min-w-0">
        {active === "profil" && <ProfilSection me={me} />}
        {active === "abonnement" && (
          <AbonnementSection
            me={me}
            freePlan={freePlan}
            proPlan={proPlan}
            elitePlan={elitePlan}
          />
        )}
        {active === "trading" && (
          <TradingSection markets={markets} setMarkets={setMarkets} />
        )}
        {active === "notifications" && (
          <NotificationsSection notifs={notifs} setNotifs={setNotifs} />
        )}
        {active === "securite" && <SecuriteSection />}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}

function ProfilSection({ me }: { me: Me | null }) {
  const name = me?.name ?? "";
  const email = me?.email ?? "";
  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <SectionTitle
        title="Profil"
        subtitle="Vos informations personnelles et votre identité publique."
      />
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
          {me?.initials ?? "··"}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{name || "—"}</p>
          <p className="text-sm text-ink-muted">{email || "—"}</p>
          <button
            type="button"
            className="mt-1.5 text-xs font-medium text-brand hover:underline"
          >
            Changer l'avatar
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet">
          <input
            key={name}
            className={inputClass}
            defaultValue={name}
            placeholder="Votre nom"
          />
        </Field>
        <Field label="Adresse email">
          <input
            key={email}
            type="email"
            className={inputClass}
            defaultValue={email}
            placeholder="vous@exemple.com"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary">Enregistrer</Button>
      </div>
    </Card>
  );
}

function AbonnementSection({
  me,
  freePlan,
  proPlan,
  elitePlan,
}: {
  me: Me | null;
  freePlan?: (typeof PLANS)[number];
  proPlan?: (typeof PLANS)[number];
  elitePlan?: (typeof PLANS)[number];
}) {
  const currentId = me?.plan ?? "free";
  const current = PLANS.find((p) => p.id === currentId) ?? freePlan;
  const price =
    currentId === "free" ? "0 € / mois" : `${current?.priceYearly} € / mois`;
  const isFree = currentId === "free";
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
        <SectionTitle
          title="Abonnement"
          subtitle="Votre plan actuel et vos options d'évolution."
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-ink">
              {PLAN_LABEL[currentId]}
            </span>
            <Badge tone={isFree ? "muted" : "brand"}>Plan actuel</Badge>
          </div>
          <span className="text-sm text-ink-muted">{price}</span>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(current?.features ?? []).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Card>

      {!isFree && (
        <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Gérer l'abonnement</p>
              <p className="text-sm text-ink-muted">
                Changez de plan ou revenez au plan gratuit à tout moment.
              </p>
            </div>
            <Button variant="outline" href="/pricing">
              Gérer les plans
            </Button>
          </div>
        </Card>
      )}

      {isFree && (
      <Card className="relative overflow-hidden rounded-2xl border border-brand/40 bg-brand/5 p-5 sm:p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <h3 className="text-lg font-semibold text-ink">
                Débloquez tout le potentiel
              </h3>
            </div>
            <Badge tone="brand">Recommandé</Badge>
          </div>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Analyses IA étendues, scénarios complets (bull / bear / neutre),
            watchlists illimitées et alertes personnalisées. Passez au niveau
            supérieur.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-raised/60 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink">Pro</span>
                <span className="text-sm text-ink-muted">
                  <span className="tnum text-xl font-bold text-ink">
                    {proPlan?.priceYearly}
                  </span>{" "}
                  € / mois
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Facturé annuellement · pour les traders actifs.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised/60 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink">Elite</span>
                <span className="text-sm text-ink-muted">
                  <span className="tnum text-xl font-bold text-ink">
                    {elitePlan?.priceYearly}
                  </span>{" "}
                  € / mois
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Facturé annuellement · outils pro & priorité.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="primary" href="/pricing">
              Passer au Pro
            </Button>
            <Button variant="ghost" href="/pricing">
              Comparer les plans
            </Button>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            Facturation gérée via Stripe. En mode démo, aucun paiement réel n'est
            traité — le plan est activé immédiatement.
          </p>
        </div>
      </Card>
      )}
    </div>
  );
}

function TradingSection({
  markets,
  setMarkets,
}: {
  markets: Record<string, boolean>;
  setMarkets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <SectionTitle
        title="Préférences de trading"
        subtitle="Personnalisez les analyses IA selon votre profil de trader."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Style de trading">
          <select className={inputClass} defaultValue="Swing">
            <option>Day trading</option>
            <option>Swing</option>
            <option>Scalping</option>
            <option>Investissement</option>
          </select>
        </Field>
        <Field label="Niveau d'expérience">
          <select className={inputClass} defaultValue="Intermédiaire">
            <option>Débutant</option>
            <option>Intermédiaire</option>
            <option>Avancé</option>
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-medium text-ink-muted">
          Marchés favoris
        </span>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => {
            const on = markets[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() =>
                  setMarkets((prev) => ({ ...prev, [m]: !prev[m] }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  on
                    ? "border-brand/50 bg-brand/10 text-ink"
                    : "border-border-strong bg-surface-raised text-ink-muted hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded border",
                    on
                      ? "border-brand bg-brand text-[#04110F]"
                      : "border-border-strong"
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                </span>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary">Enregistrer</Button>
      </div>
    </Card>
  );
}

function NotificationsSection({
  notifs,
  setNotifs,
}: {
  notifs: {
    prix: boolean;
    analyses: boolean;
    scenarios: boolean;
    resume: boolean;
  };
  setNotifs: React.Dispatch<
    React.SetStateAction<{
      prix: boolean;
      analyses: boolean;
      scenarios: boolean;
      resume: boolean;
    }>
  >;
}) {
  const rows: {
    key: keyof typeof notifs;
    title: string;
    desc: string;
  }[] = [
    {
      key: "prix",
      title: "Alertes prix",
      desc: "Soyez notifié lorsqu'un actif franchit un seuil défini.",
    },
    {
      key: "analyses",
      title: "Nouvelles analyses IA",
      desc: "Recevez les analyses fraîches sur vos actifs suivis.",
    },
    {
      key: "scenarios",
      title: "Scénarios invalidés",
      desc: "Alerte lorsqu'un seuil d'invalidation est atteint.",
    },
    {
      key: "resume",
      title: "Résumé quotidien",
      desc: "Un digest matinal de vos marchés et signaux clés.",
    },
  ];

  return (
    <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
      <SectionTitle
        title="Notifications"
        subtitle="Choisissez ce dont vous voulez être informé."
      />
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex items-center justify-between gap-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="text-sm text-ink-muted">{r.desc}</p>
            </div>
            <Toggle
              checked={notifs[r.key]}
              onChange={(v) => setNotifs((prev) => ({ ...prev, [r.key]: v }))}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SecuriteSection() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
        <SectionTitle
          title="Sécurité"
          subtitle="Protégez l'accès à votre compte VISITRADE."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mot de passe actuel">
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Nouveau mot de passe">
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmer le mot de passe">
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface-raised/60 p-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-sm text-ink-muted">
            L'authentification à deux facteurs (2FA) sera bientôt disponible pour
            renforcer la protection de votre compte.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary">Mettre à jour le mot de passe</Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Session</p>
            <p className="text-sm text-ink-muted">
              Déconnectez-vous de cet appareil.
            </p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </form>
        </div>
      </Card>

      <Card className="rounded-2xl border border-bear/40 bg-bear/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-bear">Supprimer le compte</p>
            <p className="text-sm text-ink-muted">
              Cette action est définitive et supprime toutes vos données.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-bear/50 text-bear hover:bg-bear/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer le compte
          </Button>
        </div>
      </Card>
    </div>
  );
}
