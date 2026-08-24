"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  FEATURE_LABEL,
  PLAN_LABEL,
  minPlanFor,
  type Feature,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

function PaywallInner({
  feature,
  description,
  compact,
}: {
  feature: Feature;
  description?: string;
  compact?: boolean;
}) {
  const plan = minPlanFor(feature);
  return (
    <div className="flex flex-col items-center text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/12 text-brand">
        <Lock className="h-5 w-5" />
      </span>
      <div className="mt-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{FEATURE_LABEL[feature]}</h3>
        <Badge tone="brand">{PLAN_LABEL[plan]}</Badge>
      </div>
      <p className={cn("mt-1.5 max-w-sm text-sm text-ink-muted", compact && "text-xs")}>
        {description ??
          `Cette fonctionnalité est réservée au plan ${PLAN_LABEL[plan]}. Passez au niveau supérieur pour la débloquer.`}
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
      >
        <Sparkles className="h-4 w-4" />
        Passer au {PLAN_LABEL[plan]}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// Standalone locked card (replaces content entirely).
export function PaywallCard({
  feature,
  description,
  className,
}: {
  feature: Feature;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl border border-dashed border-brand/30 bg-brand/[0.04] px-6 py-12",
        className,
      )}
    >
      <PaywallInner feature={feature} description={description} />
    </div>
  );
}

// Overlay centered on top of blurred teaser content.
export function PaywallOverlay({
  feature,
  description,
}: {
  feature: Feature;
  description?: string;
}) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-gradient-to-b from-base/40 via-base/70 to-base/90 p-4">
      <div className="rounded-2xl border border-brand/25 bg-surface/90 p-5 shadow-glow backdrop-blur-sm">
        <PaywallInner feature={feature} description={description} compact />
      </div>
    </div>
  );
}
