import { provider } from "@/lib/market-data/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { AssetTable } from "@/components/app/AssetTable";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { MarketsFilter } from "@/components/app/MarketsFilter";

export const metadata = { title: "Markets — VISITRADE" };

export default async function MarketsPage() {
  const assets = await provider.listAssets();
  return (
    <>
      <PageHeader
        title="Markets"
        subtitle="Explorez les actifs, comparez les signaux et ouvrez une analyse détaillée."
      />
      <MarketsFilter assets={assets} />
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
