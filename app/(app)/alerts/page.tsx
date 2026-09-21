import { provider } from "@/lib/market-data/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { AlertsClient } from "@/components/app/AlertsClient";
import { ServerPlanGate } from "@/components/app/ServerPlanGate";

export const metadata = { title: "Alertes — VISITRADE" };

// Dépend de la session (droits d’abonnement) → rendu à la demande.
export const dynamic = "force-dynamic";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams?: { symbol?: string };
}) {
  const assets = await provider.listAssets();
  // Arrivée depuis la fiche d'un actif (bouton « Alerte ») : le sélecteur
  // s'ouvre directement sur cet actif plutôt que sur le premier de la liste.
  const preset = searchParams?.symbol?.toUpperCase();
  const initialSymbol = assets.some((a) => a.symbol === preset) ? preset : undefined;
  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle="Soyez prévenu dès qu'une condition de marché est remplie, sans surveiller les cours en continu."
      />
      <ServerPlanGate
        feature="alerts"
        mode="blur"
        description="Les alertes personnalisées (prix, volatilité, configuration, scénario invalidé, nouvelle analyse IA) sont réservées au plan Pro."
      >
        <AlertsClient assets={assets} initialSymbol={initialSymbol} />
      </ServerPlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
