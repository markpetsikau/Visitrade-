import { PageHeader } from "@/components/app/PageHeader";
import { PlanGate } from "@/components/app/PlanGate";
import { PortfolioClient } from "@/components/app/PortfolioClient";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { provider } from "@/lib/market-data/provider";

export const metadata = { title: "Portfolio — VISITRADE" };

export default async function PortfolioPage() {
  const assets = await provider.listAssets();
  const pick = assets.map((a) => ({
    symbol: a.symbol,
    name: a.name,
    image: a.image,
    price: a.price,
  }));

  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Suivez vos positions, votre allocation et votre performance en temps réel."
      />
      <PlanGate
        feature="portfolio"
        mode="blur"
        description="Le suivi de portefeuille (valeur, P&L, allocation, positions) est réservé au plan Pro."
      >
        <PortfolioClient assets={pick} />
      </PlanGate>
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
