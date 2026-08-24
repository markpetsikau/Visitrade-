import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

// Lightweight SVG area chart (no external deps). Illustrative.
export function PriceChart({
  data,
  levels,
  height = 260,
  className,
}: {
  data: number[];
  levels?: { price: number; type: string }[];
  height?: number;
  className?: string;
}) {
  const w = 800;
  const h = height;
  const padY = 24;
  const min = Math.min(...data, ...(levels?.map((l) => l.price) ?? []));
  const max = Math.max(...data, ...(levels?.map((l) => l.price) ?? []));
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const y = (v: number) => h - padY - ((v - min) / range) * (h - padY * 2);
  const pts = data.map((v, i) => [i * stepX, y(v)] as const);
  const line = pts.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#22C55E" : "#F04452";
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="pc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line
            key={f}
            x1="0"
            x2={w}
            y1={padY + f * (h - padY * 2)}
            y2={padY + f * (h - padY * 2)}
            stroke="#1E2836"
            strokeWidth="1"
          />
        ))}

        {/* key levels */}
        {levels?.map((l, i) => {
          const ly = y(l.price);
          const stroke = l.type === "resistance" ? "#F04452" : l.type === "support" ? "#22C55E" : "#94A3B8";
          return (
            <line
              key={i}
              x1="0"
              x2={w}
              y1={ly}
              y2={ly}
              stroke={stroke}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          );
        })}

        <path d={area} fill="url(#pc-area)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      {/* level labels */}
      {levels && (
        <div className="pointer-events-none absolute inset-0">
          {levels.map((l, i) => {
            const topPct = (y(l.price) / h) * 100;
            const c = l.type === "resistance" ? "text-bear" : l.type === "support" ? "text-bull" : "text-neutral";
            return (
              <span
                key={i}
                className={cn("absolute right-1 -translate-y-1/2 rounded bg-base/80 px-1 text-[10px] tnum", c)}
                style={{ top: `${topPct}%` }}
              >
                {formatPrice(l.price)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
