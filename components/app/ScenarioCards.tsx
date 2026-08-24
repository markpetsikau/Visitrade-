import type { Scenario } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Check, X } from "lucide-react";

const style = {
  bullish: { border: "border-bull/30", bg: "bg-bull/[0.04]", text: "text-bull", icon: TrendingUp },
  bearish: { border: "border-bear/30", bg: "bg-bear/[0.04]", text: "text-bear", icon: TrendingDown },
  neutral: { border: "border-neutral/30", bg: "bg-neutral/[0.04]", text: "text-neutral", icon: Minus },
};

export function ScenarioCards({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {scenarios.map((s) => {
        const st = style[s.kind];
        const Icon = st.icon;
        return (
          <div key={s.kind} className={cn("rounded-2xl border p-5", st.border, st.bg)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", st.text)} />
                <h3 className="font-semibold text-ink">{s.title}</h3>
              </div>
            </div>
            <span className={cn("mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium", st.border, st.text)}>
              {s.probabilityLabel}
            </span>

            <div className="mt-4 space-y-3 text-sm">
              <Block label="Conditions">
                <ul className="space-y-1">
                  {s.conditions.map((c) => (
                    <li key={c} className="text-ink-muted">• {c}</li>
                  ))}
                </ul>
              </Block>
              <Block label="Niveaux à surveiller">
                <p className="tnum text-ink">{s.watchLevels.join(" · ")}</p>
              </Block>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-base/40 p-2.5">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-warn">Invalidation</div>
                  <div className="text-xs text-ink-muted">{s.invalidation}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="mb-1 text-[11px] font-medium text-bull">Favorable</div>
                  <ul className="space-y-1">
                    {s.favorable.map((f) => (
                      <li key={f} className="flex items-start gap-1 text-[11px] text-ink-muted">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-bull" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-medium text-bear">Défavorable</div>
                  <ul className="space-y-1">
                    {s.unfavorable.map((f) => (
                      <li key={f} className="flex items-start gap-1 text-[11px] text-ink-muted">
                        <X className="mt-0.5 h-3 w-3 shrink-0 text-bear" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      {children}
    </div>
  );
}
