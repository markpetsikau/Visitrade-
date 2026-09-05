import { provider } from "@/lib/market-data/provider";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { PageHeader } from "@/components/app/PageHeader";
import { ScenariosClient } from "@/components/app/ScenariosClient";
import { ServerPlanGate } from "@/components/app/ServerPlanGate";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Scenarios — VISITRADE" };

// Dépend de la session (droits d’abonnement) → rendu à la demande.
export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const assets = await provider.listAssets();
  const picks = ["BTC", "ETH", "XAU", "NDX", "SOL", "WTI"]
    .map((s) => assets.find((a) => a.symbol === s))
    .filter(Boolean) as typeof assets;
  const items = picks.map((asset) => ({ asset, analysis: analyzeAsset(asset) }));

  return (
    <>
      <PageHeader
        title="Market Scenarios"
        subtitle="Plusieurs futurs possibles par actif — conditions, niveaux et invalidation."
      />
      <ServerPlanGate
        feature="scenarios"
        mode="blur"
        description="Les scénarios haussier / baissier / neutre, avec conditions, niveaux et seuils d'invalidation, sont réservés au plan Pro."
      >
        <ScenariosClient items={items} />
      </ServerPlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
