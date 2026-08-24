import Link from "next/link";
import type { Asset } from "@/lib/types";
import { AssetIcon, classLabelOf } from "@/components/ui/AssetIcon";
import { Sparkline } from "@/components/ui/Sparkline";
import { LivePrice, LiveChange } from "@/components/app/LivePrices";
import { ChangeBadge } from "@/components/ui/Badge";
import { formatCompact } from "@/lib/utils";

export function AssetTable({
  assets,
  extraSignals,
}: {
  assets: Asset[];
  extraSignals?: Record<string, string[]>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised/40">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-ink-faint">
            <th className="px-4 py-3 font-medium">Actif</th>
            <th className="px-4 py-3 text-right font-medium">Prix</th>
            <th className="px-4 py-3 text-right font-medium">24h</th>
            <th className="px-4 py-3 text-right font-medium">7j</th>
            <th className="px-4 py-3 text-right font-medium">Volatilité</th>
            <th className="px-4 py-3 text-right font-medium">RSI</th>
            <th className="px-4 py-3 text-center font-medium">7j</th>
            <th className="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr
              key={a.symbol}
              className="group border-b border-border/50 transition-colors last:border-0 hover:bg-surface-hover/50"
            >
              <td className="px-4 py-3">
                <Link href={`/markets/${a.symbol}`} className="flex items-center gap-3">
                  <AssetIcon symbol={a.symbol} src={a.image} size={32} />
                  <div>
                    <div className="font-medium text-ink">{a.symbol}</div>
                    <div className="text-xs text-ink-faint">{a.name}</div>
                  </div>
                </Link>
                {extraSignals?.[a.symbol] && (
                  <div className="mt-1.5 flex flex-wrap gap-1 pl-11">
                    {extraSignals[a.symbol].map((s) => (
                      <span
                        key={s}
                        className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium text-ink">
                <LivePrice symbol={a.symbol} price={a.price} />
              </td>
              <td className="px-4 py-3 text-right">
                <LiveChange symbol={a.symbol} value={a.changePct24h} />
              </td>
              <td className="px-4 py-3 text-right">
                <ChangeBadge value={a.changePct7d} />
              </td>
              <td className="tnum px-4 py-3 text-right text-ink-muted">
                {a.volatility.toFixed(0)}%
              </td>
              <td className="tnum px-4 py-3 text-right text-ink-muted">
                {a.rsi.toFixed(0)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  <Sparkline data={a.spark} width={84} height={28} />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/markets/${a.symbol}`}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink-muted opacity-0 transition-opacity hover:border-brand/40 hover:text-ink group-hover:opacity-100"
                >
                  Analyser
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
