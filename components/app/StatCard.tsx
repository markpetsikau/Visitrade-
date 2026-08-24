import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "bull" | "bear" | "brand";
  icon?: React.ReactNode;
}) {
  const toneCls = {
    default: "text-ink",
    bull: "text-bull",
    bear: "text-bear",
    brand: "text-brand",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface-raised/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">{label}</span>
        {icon && <span className="text-ink-faint">{icon}</span>}
      </div>
      <div className={cn("tnum mt-2 text-2xl font-semibold", toneCls)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}
