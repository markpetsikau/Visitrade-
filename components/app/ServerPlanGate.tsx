// ─────────────────────────────────────────────────────────────
// Verrou d'abonnement évalué CÔTÉ SERVEUR.
//
// `PlanGate` (client) décide après coup : le contenu payant est
// quand même envoyé au navigateur, blur ou pas. Il suffisait
// d'ouvrir le source de la page pour lire les scénarios Pro.
//
// Ici, si le plan n'ouvre pas la fonctionnalité, `children` n'est
// jamais rendu — donc jamais sérialisé. Le mode "blur" affiche un
// aperçu factice (aucune donnée réelle) sous l'overlay de paywall.
// ─────────────────────────────────────────────────────────────

import { getSession } from "@/lib/auth/session";
import { hasFeature, type Feature } from "@/lib/plans";
import { PaywallCard, PaywallOverlay } from "@/components/app/Paywall";

export async function ServerPlanGate({
  feature,
  children,
  mode = "replace",
  description,
  className,
}: {
  feature: Feature;
  children?: React.ReactNode;
  mode?: "blur" | "replace";
  description?: string;
  className?: string;
}) {
  const session = await getSession();

  if (hasFeature(session?.plan, feature)) {
    return <>{children}</>;
  }

  if (mode === "blur") {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none select-none opacity-50 blur-[7px]" aria-hidden>
          <LockedPreview />
        </div>
        <PaywallOverlay feature={feature} description={description} />
      </div>
    );
  }

  return <PaywallCard feature={feature} description={description} className={className} />;
}

/** Aperçu décoratif : formes vides, aucune donnée de marché. */
function LockedPreview() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-raised/40 p-4">
            <div className="h-3 w-20 rounded bg-ink-faint/25" />
            <div className="mt-3 h-6 w-28 rounded bg-ink-faint/20" />
            <div className="mt-3 h-2.5 w-full rounded bg-ink-faint/15" />
            <div className="mt-1.5 h-2.5 w-4/5 rounded bg-ink-faint/15" />
          </div>
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface-raised/40 p-4">
          <div className="h-3 w-40 rounded bg-ink-faint/25" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-full rounded bg-ink-faint/15" />
            <div className="h-2.5 w-11/12 rounded bg-ink-faint/15" />
            <div className="h-2.5 w-3/5 rounded bg-ink-faint/15" />
          </div>
        </div>
      ))}
    </div>
  );
}
