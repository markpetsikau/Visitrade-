import { provider } from "@/lib/market-data/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { ScannerClient } from "@/components/app/ScannerClient";
import { PlanGate } from "@/components/app/PlanGate";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Scanner — VISITRADE" };

export default async function ScannerPage() {
  const assets = await provider.listAssets();
  return (
    <>
      <PageHeader
        title="Market Scanner"
        subtitle="Filtrez les actifs par tendance, momentum, volatilité et configuration technique."
      />
      <PlanGate
        feature="scanner"
        mode="blur"
        description="Le scanner qui filtre les actifs par tendance, momentum, volatilité et configuration technique est réservé au plan Pro."
      >
        <ScannerClient assets={assets} />
      </PlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
