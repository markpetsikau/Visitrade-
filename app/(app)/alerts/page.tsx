import { provider } from "@/lib/market-data/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { AlertsClient } from "@/components/app/AlertsClient";
import { PlanGate } from "@/components/app/PlanGate";

export const metadata = { title: "Alertes — VISITRADE" };

export default async function AlertsPage() {
  const assets = await provider.listAssets();
  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle="Soyez prévenu dès qu'une condition de marché est remplie, sans surveiller les cours en continu."
      />
      <PlanGate
        feature="alerts"
        mode="blur"
        description="Les alertes personnalisées (prix, volatilité, configuration, scénario invalidé, nouvelle analyse IA) sont réservées au plan Pro."
      >
        <AlertsClient assets={assets} />
      </PlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
