import { PageHeader } from "@/components/app/PageHeader";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { WatchlistClient } from "@/components/app/WatchlistClient";
import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Watchlist — VISITRADE" };

export default function WatchlistPage() {
  const session = getSession();
  // Seed from the assets chosen during onboarding (empty for a brand-new account).
  const initial = (session?.watchlist ?? []).filter((s) =>
    MOCK_ASSETS.some((a) => a.symbol === s),
  );
  return (
    <>
      <PageHeader
        title="Watchlist"
        subtitle="Suivez vos actifs favoris et gardez leurs signaux clés à portée de main."
      />
      <WatchlistClient assets={MOCK_ASSETS} initial={initial} />
      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
