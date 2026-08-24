import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Radar,
  Star,
  GitBranch,
  Gauge,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { provider } from "@/lib/market-data/provider";
import { getSession } from "@/lib/auth/session";
import { analyzeAsset } from "@/lib/ai/analysis-engine";
import { PageHeader } from "@/components/app/PageHeader";
import { Greeting } from "@/components/app/Greeting";
import { LivePrice, LiveChange } from "@/components/app/LivePrices";
import { PlanGate } from "@/components/app/PlanGate";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { Sparkline } from "@/components/ui/Sparkline";
import { TrendBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const metadata = { title: "Dashboard — VISITRADE" };

export default async function DashboardPage() {
  const assets = await provider.listAssets();
  const sorted = [...assets].sort((a, b) => b.changePct24h - a.changePct24h);
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  const avg = assets.reduce((s, a) => s + a.changePct24h, 0) / assets.length;
  const bullish = assets.filter((a) => a.momentum > 10).length;
  const sentiment = avg > 0.5 ? "Risk-on" : avg < -0.5 ? "Risk-off" : "Neutre";
  const sentimentTone = avg > 0.5 ? "bull" : avg < -0.5 ? "bear" : "brand";

  // Top opportunities: strongest trend + momentum
  const opportunities = [...assets]
    .sort((a, b) => b.trendStrength + b.momentum - (a.trendStrength + a.momentum))
    .slice(0, 4);

  const insights = [gainers[0], losers[0], opportunities[0]].map((a) => ({
    asset: a,
    analysis: analyzeAsset(a),
  }));

  const session = getSession();
  const watched = (session?.watchlist ?? [])
    .map((s) => assets.find((a) => a.symbol === s))
    .filter(Boolean) as typeof assets;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            <Greeting /> Vue d'ensemble du marché, opportunités et dernières analyses IA.
          </>
        }
        action={
          <Button href="/ai" size="sm">
            <Sparkles className="h-4 w-4" /> Nouvelle analyse
          </Button>
        }
      />

      {/* Sentiment stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sentiment de marché"
          value={sentiment}
          hint={`Variation moyenne ${avg >= 0 ? "+" : ""}${avg.toFixed(2)}% (24h)`}
          tone={sentimentTone as "bull" | "bear" | "brand"}
          icon={<Gauge className="h-4 w-4" />}
        />
        <StatCard
          label="Actifs en tendance haussière"
          value={`${bullish}/${assets.length}`}
          hint="Momentum > 10"
          tone="brand"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Meilleure perf. 24h"
          value={`${gainers[0].symbol} ${gainers[0].changePct24h >= 0 ? "+" : ""}${gainers[0].changePct24h.toFixed(2)}%`}
          hint={gainers[0].name}
          tone="bull"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Pire perf. 24h"
          value={`${losers[0].symbol} ${losers[0].changePct24h.toFixed(2)}%`}
          hint={losers[0].name}
          tone="bear"
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Market Overview */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Market Overview"
            subtitle="Les principaux actifs suivis"
            action={
              <Link href="/markets" className="text-xs font-medium text-brand hover:underline">
                Tous les marchés →
              </Link>
            }
          />
          <div className="px-2 pb-3">
            {assets.slice(0, 6).map((a) => (
              <Link
                key={a.symbol}
                href={`/markets/${a.symbol}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover/60"
              >
                <AssetIcon symbol={a.symbol} src={a.image} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{a.symbol}</div>
                  <div className="truncate text-xs text-ink-faint">{a.name}</div>
                </div>
                <Sparkline data={a.spark} width={72} height={26} />
                <div className="w-24 text-right">
                  <div className="text-sm font-medium text-ink">
                    <LivePrice symbol={a.symbol} price={a.price} />
                  </div>
                  <LiveChange symbol={a.symbol} value={a.changePct24h} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Top Opportunities */}
        <Card>
          <CardHeader
            title="Top Opportunities"
            subtitle="Tendance + momentum les plus forts"
            action={<Radar className="h-4 w-4 text-ink-faint" />}
          />
          <div className="space-y-1 px-2 pb-3">
            {opportunities.map((a) => (
              <Link
                key={a.symbol}
                href={`/markets/${a.symbol}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover/60"
              >
                <AssetIcon symbol={a.symbol} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{a.symbol}</div>
                  <div className="text-[11px] text-ink-faint">Force {a.trendStrength}/100</div>
                </div>
                <TrendBadge trend={a.momentum > 10 ? "bullish" : a.momentum < -10 ? "bearish" : "neutral"} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-brand" /> AI Insights
          </h2>
          <Link href="/ai" className="text-xs font-medium text-brand hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map(({ asset, analysis }) => (
            <Card key={asset.symbol} interactive className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AssetIcon symbol={asset.symbol} size={28} />
                  <span className="text-sm font-medium text-ink">{asset.symbol}</span>
                </div>
                <TrendBadge trend={analysis.trend.direction} />
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                {analysis.summary}
              </p>
              <Link
                href={`/markets/${asset.symbol}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand"
              >
                Analyse complète <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Watchlist + Scenarios */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Watchlist"
            subtitle="Vos actifs suivis"
            action={
              <Link href="/watchlist" className="text-xs font-medium text-brand hover:underline">
                Gérer →
              </Link>
            }
          />
          <div className="px-2 pb-3">
            {watched.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Star className="mx-auto h-6 w-6 text-ink-faint" />
                <p className="mt-2 text-sm text-ink-muted">Votre watchlist est vide.</p>
                <Link href="/watchlist" className="mt-1 inline-block text-xs font-medium text-brand hover:underline">
                  Ajouter des actifs →
                </Link>
              </div>
            ) : (
              watched.map((a) => (
                <Link
                  key={a.symbol}
                  href={`/markets/${a.symbol}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-hover/60"
                >
                  <Star className="h-3.5 w-3.5 text-brand" />
                  <AssetIcon symbol={a.symbol} src={a.image} size={24} />
                  <span className="flex-1 text-sm text-ink">{a.symbol}</span>
                  <span className="text-sm text-ink-muted">
                    <LivePrice symbol={a.symbol} price={a.price} />
                  </span>
                  <LiveChange symbol={a.symbol} value={a.changePct24h} />
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Scénarios à surveiller"
            subtitle="Configurations repérées sur le marché"
            action={
              <Link href="/scenarios" className="text-xs font-medium text-brand hover:underline">
                Voir →
              </Link>
            }
          />
          <div className="px-4 pb-4">
            <PlanGate feature="scenarios" mode="blur">
              <div className="space-y-2">
                {opportunities.slice(0, 3).map((a) => {
                  const an = analyzeAsset(a);
                  const sc = an.scenarios[0];
                  return (
                    <div key={a.symbol} className="rounded-lg border border-border bg-surface/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">{a.symbol} · {sc.title}</span>
                        <GitBranch className="h-3.5 w-3.5 text-ink-faint" />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        Invalidation : {sc.invalidation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </PlanGate>
          </div>
        </Card>
      </div>

      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
