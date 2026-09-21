import { MOCK_ASSETS } from "@/lib/market-data/mock-assets";
import { provider } from "@/lib/market-data/provider";
import type { Asset } from "@/lib/types";
import { Sparkline } from "@/components/ui/Sparkline";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { formatPrice } from "@/lib/utils";
import { ChangeBadge, TrendBadge, Badge } from "@/components/ui/Badge";
import { Sparkles, ArrowUpRight, ShieldCheck } from "lucide-react";

// Aperçu du produit affiché dans le hero.
//
// Il portait un badge « Live » au-dessus de cours figés dans le code
// (BTC à 64 820 $ pendant que le marché cotait 76 000 $) : le premier
// écran du site démentait la promesse du produit. Les mêmes cours réels
// que l'application sont désormais utilisés, avec repli sur le jeu
// simulé si l'API tierce ne répond pas — le badge s'ajuste alors.
// Les stablecoins sont dans le top 5 des capitalisations mais n'ont
// aucun intérêt dans une vitrine : une colonne de « −0,01 % » à 1,00 $.
const STABLES = new Set([
  "USDT", "USDC", "USDS", "DAI", "USDE", "FDUSD", "BUSD", "TUSD", "PYUSD", "USD1",
]);

export async function HeroDashboard() {
  let rows: Asset[] = MOCK_ASSETS.slice(0, 5);
  let live = false;
  try {
    const assets = (await provider.listAssets({ class: "crypto" })).filter(
      (a) => !STABLES.has(a.symbol),
    );
    if (assets.length >= 5) {
      rows = assets.slice(0, 5);
      live = provider.isLive;
    }
  } catch {
    /* repli sur le jeu simulé */
  }
  const lead = rows[0];
  const bullish = lead.changePct7d >= 0;

  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand/10 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-card">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-raised/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bear/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-bull/60" />
          <span className="ml-3 text-xs text-ink-faint">visitrade.app/dashboard</span>
          <Badge tone={live ? "brand" : "muted"} className="ml-auto">
            {live && (
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" />
            )}
            {live ? "Live" : "Démo"}
          </Badge>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr]">
          {/* left: market overview */}
          <div className="rounded-xl border border-border bg-surface-raised/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">Market Overview</span>
              <span className="text-[11px] text-ink-faint">24h</span>
            </div>
            <div className="space-y-1.5">
              {rows.map((a) => (
                <div
                  key={a.symbol}
                  className="flex items-center gap-3 rounded-lg px-1.5 py-1.5"
                >
                  <AssetIcon symbol={a.symbol} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">{a.symbol}</div>
                    <div className="truncate text-[11px] text-ink-faint">{a.name}</div>
                  </div>
                  <Sparkline data={a.spark} width={64} height={22} />
                  <div className="w-20 text-right">
                    <div className="tnum text-[13px] font-medium text-ink">
                      {formatPrice(a.price)}
                    </div>
                    <ChangeBadge value={a.changePct24h} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: AI insight */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-brand/25 bg-brand/[0.06] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <span className="text-xs font-semibold text-ink">
                  AI Analysis · {lead.symbol}
                </span>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <TrendBadge trend={bullish ? "bullish" : "bearish"} />
                <span className="text-[11px] text-ink-muted">
                  Force {Math.round(lead.trendStrength)}/100
                </span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                {bullish
                  ? "Structure haussière sur 7 jours, momentum positif. Surveiller la réaction au-dessus de la résistance proche."
                  : "Structure baissière sur 7 jours, momentum négatif. Surveiller la tenue du support proche."}
              </p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-brand">
                Voir l'analyse <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "Bull", tone: "text-bull" },
                { k: "Neutre", tone: "text-neutral" },
                { k: "Bear", tone: "text-bear" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-lg border border-border bg-surface-raised/60 p-2 text-center"
                >
                  <div className={`text-[11px] font-semibold ${s.tone}`}>{s.k}</div>
                  <div className="mt-1 text-[10px] text-ink-faint">Scénario</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised/60 p-3">
              <ShieldCheck className="h-4 w-4 text-ink-faint" />
              <span className="text-[10.5px] leading-tight text-ink-faint">
                Aide à la décision — aucune garantie de résultat.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
