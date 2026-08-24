import { cn } from "@/lib/utils";
import type { Trend } from "@/lib/types";

type Tone = "brand" | "bull" | "bear" | "neutral" | "warn" | "muted";

const tones: Record<Tone, string> = {
  brand: "bg-brand/12 text-brand border-brand/25",
  bull: "bg-bull/12 text-bull border-bull/25",
  bear: "bg-bear/12 text-bear border-bear/25",
  neutral: "bg-neutral/12 text-neutral border-neutral/25",
  warn: "bg-warn/12 text-warn border-warn/25",
  muted: "bg-surface-hover text-ink-muted border-border",
};

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TrendBadge({ trend }: { trend: Trend }) {
  const map = {
    bullish: { tone: "bull" as Tone, label: "Haussier" },
    bearish: { tone: "bear" as Tone, label: "Baissier" },
    neutral: { tone: "neutral" as Tone, label: "Neutre" },
  };
  const { tone, label } = map[trend];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ChangeBadge({ value }: { value: number }) {
  const tone: Tone = value > 0 ? "bull" : value < 0 ? "bear" : "neutral";
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "tnum inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        tone === "bull" && "bg-bull/10 text-bull",
        tone === "bear" && "bg-bear/10 text-bear",
        tone === "neutral" && "bg-neutral/10 text-neutral",
      )}
    >
      {sign}
      {value.toFixed(2)}%
    </span>
  );
}
