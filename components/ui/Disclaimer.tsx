import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCLAIMER_SHORT } from "@/lib/constants";

export function Disclaimer({
  variant = "inline",
  className,
  children,
}: {
  variant?: "inline" | "banner";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-[11px] leading-relaxed text-ink-faint",
        variant === "banner" &&
          "rounded-xl border border-border bg-surface/60 p-3 text-xs text-ink-muted",
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
      <p>{children ?? DISCLAIMER_SHORT}</p>
    </div>
  );
}

export function MockDataTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn",
        className,
      )}
      title="Données simulées — l'architecture est prête à brancher une API réelle."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      Données simulées
    </span>
  );
}
