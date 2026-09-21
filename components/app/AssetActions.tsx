"use client";

// Les boutons « Suivre » et « Alerte » de la fiche d'un actif étaient
// purement décoratifs : aucun gestionnaire de clic, aucun lien. Ils sont
// désormais branchés — watchlist réelle (avec le plafond du plan renvoyé
// par l'API) et renvoi vers la création d'alerte pré-remplie.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addNotification } from "@/components/app/notifications";

export function AssetActions({ symbol }: { symbol: string }) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/watchlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setFollowing(Boolean(d?.symbols?.includes(symbol)));
      })
      .catch(() => {
        if (!cancelled) setFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const current = await fetch("/api/watchlist").then((r) => r.json());
      const list: string[] = current?.symbols ?? [];
      const next = following
        ? list.filter((s) => s !== symbol)
        : [...list.filter((s) => s !== symbol), symbol];

      const res = await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        addNotification("Watchlist", data?.error ?? "Action impossible.");
        return;
      }
      const saved: string[] = data?.symbols ?? [];
      const now = saved.includes(symbol);
      setFollowing(now);

      if (!following && !now) {
        // Le plafond du plan a tronqué la liste côté serveur.
        addNotification(
          "Watchlist pleine",
          `Limitée à ${data?.max ?? 3} actifs sur votre plan. Passez au Pro pour l'illimité.`,
        );
      } else {
        addNotification("Watchlist", now ? `${symbol} ajouté à votre watchlist.` : `${symbol} retiré de votre watchlist.`);
      }
    } catch {
      addNotification("Watchlist", "Action impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant={following ? "primary" : "secondary"} size="sm" onClick={toggle} disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : following ? (
          <Check className="h-4 w-4" />
        ) : (
          <Star className="h-4 w-4" />
        )}
        {following ? "Suivi" : "Suivre"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push(`/alerts?symbol=${encodeURIComponent(symbol)}`)}
      >
        <Bell className="h-4 w-4" /> Alerte
      </Button>
    </div>
  );
}
