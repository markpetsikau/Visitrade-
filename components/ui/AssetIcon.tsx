import type { AssetClass } from "@/lib/types";
import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  BNB: "#F3BA2F",
  XRP: "#23292F",
  ADA: "#0033AD",
  AVAX: "#E84142",
  DOGE: "#C2A633",
  SPX: "#3B82F6",
  NDX: "#8B5CF6",
  DJI: "#0EA5E9",
  DAX: "#F59E0B",
  VIX: "#EF4444",
  XAU: "#D4AF37",
  XAG: "#B4B7BD",
  WTI: "#4B5563",
  NG: "#38BDF8",
  HG: "#B45309",
};

const classLabel: Record<AssetClass, string> = {
  crypto: "Crypto",
  index: "Indice",
  commodity: "Matière 1re",
  stock: "Action",
  forex: "Forex",
};

// Deterministic pleasant color from a symbol (for the hundreds of coins
// without a hand-picked palette entry).
function hashColor(sym: string): string {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 48%)`;
}

export function AssetIcon({
  symbol,
  size = 34,
  className,
  src,
}: {
  symbol: string;
  size?: number;
  className?: string;
  src?: string;
}) {
  // Real logo (live crypto) when available.
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        loading="lazy"
        className={cn("shrink-0 rounded-full bg-surface object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const color = palette[symbol] ?? hashColor(symbol);
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white/95",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        boxShadow: `0 4px 14px -6px ${color}88`,
      }}
      aria-hidden
    >
      {symbol.slice(0, 2)}
    </span>
  );
}

export function classLabelOf(c: AssetClass) {
  return classLabel[c];
}
