"use client";

import { useEffect, useRef, useState } from "react";
import { useLive, getQuoteNow } from "@/components/app/LivePrices";
import { addNotification } from "@/components/app/notifications";
import type { StoredAlert } from "@/lib/data/types";
import { formatPrice } from "@/lib/utils";

const RELOAD_MS = 60_000;

// Surveille les alertes « Prix atteint » sur les cours en direct.
//
// Les alertes viennent maintenant du compte (API), plus du localStorage :
// une alerte créée sur un appareil est donc surveillée depuis n'importe
// quel autre. Le déclenchement est écrit côté serveur.
export function AlertsWatcher() {
  const { updatedAt } = useLive();
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  // Identifiants déjà déclenchés dans cet onglet : évite une double
  // notification entre le déclenchement et le rechargement.
  const fired = useRef<Set<string>>(new Set());
  const allowed = useRef(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!allowed.current) return;
      try {
        const res = await fetch("/api/alerts");
        // 401/403 : pas de session, ou plan sans alertes → on arrête là.
        if (res.status === 401 || res.status === 403) {
          allowed.current = false;
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data.alerts)) setAlerts(data.alerts);
      } catch {
        /* réseau indisponible : on réessaiera au prochain cycle */
      }
    };

    load();
    const id = setInterval(load, RELOAD_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!allowed.current || alerts.length === 0) return;

    for (const a of alerts) {
      if (!a.active || a.type !== "Prix atteint" || typeof a.target !== "number") continue;
      if (fired.current.has(a.id)) continue;

      const q = getQuoteNow(a.symbol);
      if (!q) continue;

      const hit =
        (a.dir === "up" && q.price >= a.target) ||
        (a.dir === "down" && q.price <= a.target);
      if (!hit) continue;

      fired.current.add(a.id);
      addNotification(
        `Alerte : ${a.symbol}`,
        `${a.symbol} a atteint ${formatPrice(a.target)} (actuel ${formatPrice(q.price)}).`,
      );

      // Désactivation persistée : l'alerte ne se redéclenchera pas
      // au prochain chargement, sur cet appareil comme sur les autres.
      fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, active: false, triggeredAt: Date.now() }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && Array.isArray(d.alerts)) setAlerts(d.alerts);
        })
        .catch(() => {
          /* le rechargement périodique remettra les choses au clair */
        });
    }
  }, [updatedAt, alerts]);

  return null;
}
