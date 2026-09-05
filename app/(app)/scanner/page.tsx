import { provider } from "@/lib/market-data/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { ScannerClient } from "@/components/app/ScannerClient";
import { ServerPlanGate } from "@/components/app/ServerPlanGate";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Scanner — VISITRADE" };

// Dépend de la session (droits d’abonnement) → rendu à la demande.
export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const assets = await provider.listAssets();
  return (
    <>
      <PageHeader
        title="Market Scanner"
        subtitle="Filtrez les actifs par tendance, momentum, volatilité et configuration technique."
      />
      <ServerPlanGate
        feature="scanner"
        mode="blur"
        description="Le scanner qui filtre les actifs par tendance, momentum, volatilité et configuration technique est réservé au plan Pro."
      >
        <ScannerClient assets={assets} />
      </ServerPlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
