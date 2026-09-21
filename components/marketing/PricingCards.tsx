"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useMe } from "@/components/app/useMe";

export function PricingCards() {
  const [yearly, setYearly] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const me = useMe();
  const router = useRouter();

  const handleCta = async (planId: "free" | "pro" | "elite") => {
    // Logged out → send to signup.
    if (!me?.authenticated) {
      router.push("/signup");
      return;
    }
    if (planId === me.plan) {
      router.push("/dashboard");
      return;
    }
    if (planId === "free") {
      router.push("/dashboard");
      return;
    }
    setPending(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // La périodicité affichée est celle qui sera facturée.
        body: JSON.stringify({ plan: planId, cycle: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // paiement Stripe réel
      } else if (data.demo) {
        router.push(`/settings?upgraded=${planId}`); // mode démo : plan accordé
      } else {
        setPending(null);
      }
    } catch {
      setPending(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={cn(
            "text-sm transition-colors",
            !yearly ? "text-ink" : "text-ink-muted hover:text-ink",
          )}
        >
          Mensuel
        </button>

        {/* Piste 48×28 (bordure comprise) → 46×26 utiles ; bille de 20 px
            avec 3 px de marge sur les quatre côtés. `shrink-0` est
            indispensable : sans lui, la piste s'écrase dès que la ligne
            manque de place et la bille sort par-dessus « Annuel ». */}
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Facturation annuelle"
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
            yearly
              ? "border-brand/50 bg-brand/15"
              : "border-border-strong bg-surface-raised",
          )}
        >
          <span
            className={cn(
              "absolute left-[3px] top-[3px] h-5 w-5 rounded-full transition-transform duration-200",
              yearly ? "translate-x-5 bg-brand" : "translate-x-0 bg-ink-muted",
            )}
          />
        </button>

        <button
          type="button"
          onClick={() => setYearly(true)}
          className={cn(
            "text-sm transition-colors",
            yearly ? "text-ink" : "text-ink-muted hover:text-ink",
          )}
        >
          Annuel
        </button>
        <Badge tone="brand">−34%</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = yearly ? plan.priceYearly : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                plan.highlighted
                  ? "border-brand/50 bg-gradient-to-b from-brand/[0.08] to-surface-raised/40 shadow-glow"
                  : "border-border bg-surface-raised/50",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-[#04110F]">
                  Recommandé
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              </div>
              <p className="mt-1.5 min-h-[40px] text-sm text-ink-muted">
                {plan.tagline}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="tnum text-4xl font-bold text-ink">{price}€</span>
                <span className="mb-1 text-sm text-ink-muted">
                  {price === 0 ? "" : "/ mois"}
                </span>
              </div>
              <p className="mt-1 h-4 text-xs text-ink-faint">
                {yearly && price > 0 ? `Facturé ${price * 12}€ / an` : plan.limits}
              </p>

              <Button
                onClick={() => handleCta(plan.id)}
                variant={plan.highlighted ? "primary" : "secondary"}
                size="md"
                className="mt-5 w-full"
              >
                {pending === plan.id
                  ? "Redirection…"
                  : me?.authenticated && me.plan === plan.id
                    ? "Votre plan actuel"
                    : plan.cta}
              </Button>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-ink-muted">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
