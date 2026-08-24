import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Bell, ArrowLeft, Newspaper } from "lucide-react";
import { provider } from "@/lib/market-data/provider";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { AssetIcon, classLabelOf } from "@/components/ui/AssetIcon";
import { Badge, TrendBadge } from "@/components/ui/Badge";
import { LivePrice, LiveChange } from "@/components/app/LivePrices";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/app/StatCard";
import { PriceChartLive } from "@/components/app/PriceChartLive";
import { LiveAnalysis } from "@/components/app/LiveAnalysis";
import { ScenarioCards } from "@/components/app/ScenarioCards";
import { PlanGate } from "@/components/app/PlanGate";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { DataSourceTag } from "@/components/ui/DataSourceTag";
import { formatPrice, formatCompact, formatPct } from "@/lib/utils";
import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";

export function generateStaticParams() {
  return MOCK_ASSETS.map((a) => ({ asset: a.symbol }));
}

export async function generateMetadata({ params }: { params: { asset: string } }) {
  const a = await provider.getAsset(params.asset);
  return { title: a ? `${a.symbol} · ${a.name} — VISITRADE` : "Actif — VISITRADE" };
}

const mockNews: Record<string, { tag: string; text: string }[]> = {};
function contextFor(symbol: string) {
  return [
    { tag: "Contexte", text: "Le sentiment de marché global reste un facteur clé à surveiller cette semaine." },
    { tag: "Macro", text: "Les publications économiques à venir peuvent influencer la volatilité court terme." },
    { tag: "Technique", text: "La réaction aux niveaux clés proches déterminera le scénario dominant." },
  ];
}

export default async function AssetPage({ params }: { params: { asset: string } }) {
  const asset = await provider.getAsset(params.asset);
  if (!asset) notFound();
  const analysis = analyzeAsset(asset);

  return (
    <>
      <Link href="/markets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Markets
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <AssetIcon symbol={asset.symbol} src={asset.image} size={52} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{asset.symbol}</h1>
              <Badge tone="muted">{classLabelOf(asset.class)}</Badge>
              <TrendBadge trend={analysis.trend.direction} />
            </div>
            <p className="text-sm text-ink-muted">{asset.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink">
              <LivePrice symbol={asset.symbol} price={asset.price} />
            </span>
            <LiveChange symbol={asset.symbol} value={asset.changePct24h} />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm"><Star className="h-4 w-4" /> Suivre</Button>
            <Button variant="secondary" size="sm"><Bell className="h-4 w-4" /> Alerte</Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="mt-5 p-5">
        <div className="mb-1 flex items-center justify-end">
          <DataSourceTag />
        </div>
        <PriceChartLive symbol={asset.symbol} />
      </Card>

      {/* Key stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Var. 7j" value={formatPct(asset.changePct7d)} tone={asset.changePct7d >= 0 ? "bull" : "bear"} />
        <StatCard label="Volatilité" value={`${asset.volatility.toFixed(0)}%`} />
        <StatCard label="RSI (14)" value={asset.rsi.toFixed(0)} />
        <StatCard label="Force tendance" value={`${asset.trendStrength}/100`} tone="brand" />
        <StatCard label="Drawdown" value={formatPct(asset.drawdown)} tone="bear" />
        <StatCard label={asset.volume24h > 0 ? "Volume 24h" : "Plus-haut 52s"} value={asset.volume24h > 0 ? `$${formatCompact(asset.volume24h)}` : formatPrice(asset.high52)} />
      </div>

      {/* AI Analysis */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-ink">Analyse IA</h2>
        <LiveAnalysis symbol={asset.symbol} initial={analysis} />
      </section>

      {/* Scenarios */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Scénarios de marché</h2>
          <span className="text-xs text-ink-faint">Ordonnés par pertinence contextuelle</span>
        </div>
        <PlanGate
          feature="scenarios"
          mode="blur"
          description="Les scénarios haussier / baissier / neutre, avec conditions, niveaux et invalidation, sont réservés au plan Pro."
        >
          <ScenarioCards scenarios={analysis.scenarios} />
        </PlanGate>
      </section>

      {/* Context / News */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
          <Newspaper className="h-4 w-4 text-ink-muted" /> Contexte & actualités
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {contextFor(asset.symbol).map((n, i) => (
            <Card key={i} className="p-4">
              <Badge tone="muted" className="mb-2">{n.tag}</Badge>
              <p className="text-sm leading-relaxed text-ink-muted">{n.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <Disclaimer variant="banner" className="mt-8" />
    </>
  );
}
