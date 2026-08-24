"use client";

import { useEffect } from "react";
import { useLive, getQuoteNow } from "@/components/app/LivePrices";
import { addNotification } from "@/components/app/notifications";
import { formatPrice } from "@/lib/utils";

interface StoredAlert {
  id: string;
  symbol: string;
  type: string;
  detail: string;
  active: boolean;
  target?: number;
  dir?: "up" | "down";
  triggeredAt?: number;
}

// Evaluates "Prix atteint" alerts against live prices and fires them.
export function AlertsWatcher() {
  const { updatedAt } = useLive();

  useEffect(() => {
    let raw: StoredAlert[];
    try {
      raw = JSON.parse(localStorage.getItem("visitrade_alerts") || "[]");
    } catch {
      return;
    }
    if (!Array.isArray(raw) || raw.length === 0) return;

    let changed = false;
    const next = raw.map((a) => {
      if (!a.active || a.type !== "Prix atteint" || typeof a.target !== "number") return a;
      const q = getQuoteNow(a.symbol);
      if (!q) return a;
      const hit =
        (a.dir === "up" && q.price >= a.target) ||
        (a.dir === "down" && q.price <= a.target);
      if (hit) {
        changed = true;
        addNotification(
          `Alerte : ${a.symbol}`,
          `${a.symbol} a atteint ${formatPrice(a.target)} (actuel ${formatPrice(q.price)}).`,
        );
        return { ...a, active: false, triggeredAt: Date.now() };
      }
      return a;
    });

    if (changed) {
      localStorage.setItem("visitrade_alerts", JSON.stringify(next));
    }
  }, [updatedAt]);

  return null;
}
