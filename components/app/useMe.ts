"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/plans";

export interface Me {
  authenticated: boolean;
  name?: string;
  email?: string;
  initials?: string;
  plan?: Plan;
  onboarded?: boolean;
  planStatus?: string;
  planRenewsAt?: number;
  cancelAtPeriodEnd?: boolean;
  hasBilling?: boolean;
}

// Small shared client fetch for session personalization.
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => alive && setMe(d))
      .catch(() => alive && setMe({ authenticated: false }));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

export const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};
