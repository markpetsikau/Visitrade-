"use client";

import { useMe } from "@/components/app/useMe";
import { hasFeature, type Feature } from "@/lib/plans";
import { PaywallCard, PaywallOverlay } from "@/components/app/Paywall";

/**
 * Gates children behind a plan feature.
 *  - mode="blur"    → shows the children blurred with a paywall overlay (teaser).
 *  - mode="replace" → shows a standalone paywall card instead of children.
 */
export function PlanGate({
  feature,
  children,
  mode = "replace",
  description,
  className,
}: {
  feature: Feature;
  children?: React.ReactNode;
  mode?: "blur" | "replace";
  description?: string;
  className?: string;
}) {
  const me = useMe();

  // While loading, avoid a flash of locked/unlocked.
  if (!me) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-raised/40" />;
  }

  if (hasFeature(me.plan, feature)) {
    return <>{children}</>;
  }

  if (mode === "blur" && children) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none select-none opacity-50 blur-[7px]"
          aria-hidden
        >
          {children}
        </div>
        <PaywallOverlay feature={feature} description={description} />
      </div>
    );
  }

  return <PaywallCard feature={feature} description={description} className={className} />;
}
