import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { provider } from "@/lib/market-data/provider";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { AssetIcon, classLabelOf } from "@/components/ui/AssetIcon";
import { Badge, TrendBadge } from "@/components/ui/Badge";
import { LivePrice, LiveChange } from "@/components/app/LivePrices";
import { AssetActions } from "@/components/app/AssetActions";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/app/StatCard";
import { PriceChartLive } from "@/components/app/PriceChartLive";
import { LiveAnalysis } from "@/components/app/LiveAnalysis";
import { ScenarioCards } from "@/components/app/ScenarioCards";
import { ServerPlanGate } from "@/components/app/ServerPlanGate";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { DataSourceTag } from "@/components/ui/DataSourceTag";
import { formatPrice, formatCompact, formatPct } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { hasFeature } from "@/lib/plans";
import { getQuota, normalizeSymbol } from "@/lib/quota";
import { toTeaser } from "@/lib/ai/teaser";

// La page dépend de la session (droits d'accès à l'analyse) :
// rendu à la demande, jamais mis en cache statiquement.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { asset: string } }) {
  const a = await provider.getAsset(params.asset);
  return { title: a ? `${a.symbol} · ${a.name} — VISITRADE` : "Actif — VISITRADE" };
}

// Cette section affichait trois phrases fixes, identiques pour tous les
// actifs, sous le titre « Contexte & actualités » — un habillage qui
// ressemblait à de l'information de marché sans en être. Elle expose
// désormais les facteurs de risque réellement calculés pour CET actif.

export default async function AssetPage({ params }: { params: { asset: string } }) {
  const asset = await provider.getAsset(params.asset);
  if (!asset) notFound();
  const analysis = analyzeAsset(asset);

  // Droit d'accès calculé côté serveur : l'analyse complète n'est
  // envoyée au navigateur que si le plan (ou le quota Free du mois)
  // l'autorise. Sinon on ne transmet qu'un aperçu réellement amputé.
  const session = await getSession();
  const symbolKey = normalizeSymbol(asset.symbol);
  const quota = await getQuota();
  const unlimited = hasFeature(session?.plan, "fullAnalysis");
  const entitled = unlimited || quota.symbols.includes(symbolKey);

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
          <AssetActions symbol={asset.symbol} />
        </div>
      </div>

      {/* Chart */}
      <Card className="mt-5 p-5">
        <div className="mb-1 flex items-center justify-end">
          <DataSourceTag assetClass={asset.class} />
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
        <LiveAnalysis
          symbol={asset.symbol}
          initial={entitled ? analysis : toTeaser(analysis)}
          entitled={entitled}
          initialQuota={{ symbols: quota.symbols, remaining: quota.remaining, unlimited }}
        />
      </section>

      {/* Scenarios */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Scénarios de marché</h2>
          <span className="text-xs text-ink-faint">Ordonnés par pertinence contextuelle</span>
        </div>
        <ServerPlanGate
          feature="scenarios"
          mode="blur"
          description="Les scénarios haussier / baissier / neutre, avec conditions, niveaux et invalidation, sont réservés au plan Pro."
        >
          <ScenarioCards scenarios={analysis.scenarios} />
        </ServerPlanGate>
      </section>

      {/* Facteurs de risque — calculés sur les données de cet actif */}
      {analysis.riskFactors.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-ink">
            <ShieldAlert className="h-4 w-4 text-ink-muted" /> Points de vigilance
          </h2>
          <p className="mb-4 text-xs text-ink-faint">
            Établis à partir des données observées sur {asset.symbol} — volatilité,
            momentum, distance aux niveaux clés.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {analysis.riskFactors.slice(0, 6).map((r, i) => (
              <Card key={i} className="p-4">
                <Badge tone="muted" className="mb-2">
                  Risque {i + 1}
                </Badge>
                <p className="text-sm leading-relaxed text-ink-muted">{r}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Disclaimer variant="banner" className="mt-8" />
    </>
  );
}
