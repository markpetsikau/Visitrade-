"use client";

import { useState, useEffect } from "react";
import type { Asset } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/app/EmptyState";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { cn, formatPrice } from "@/lib/utils";
import { getQuoteNow } from "@/components/app/LivePrices";
import { useNotifications, markAllRead } from "@/components/app/notifications";
import { BellRing, Trash2, Plus, CheckCircle2 } from "lucide-react";

type AlertType =
  | "Prix atteint"
  | "Volatilité en hausse"
  | "Configuration détectée"
  | "Scénario invalidé"
  | "Nouvelle analyse IA";

interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  detail: string;
  active: boolean;
  target?: number;
  dir?: "up" | "down";
  triggeredAt?: number;
}

const ALERT_TYPES: AlertType[] = [
  "Prix atteint",
  "Volatilité en hausse",
  "Configuration détectée",
  "Scénario invalidé",
  "Nouvelle analyse IA",
];

const TONE_BY_TYPE: Record<
  AlertType,
  "brand" | "bull" | "bear" | "neutral" | "warn"
> = {
  "Prix atteint": "brand",
  "Volatilité en hausse": "warn",
  "Configuration détectée": "bull",
  "Scénario invalidé": "bear",
  "Nouvelle analyse IA": "neutral",
};

const SEED_ALERTS: Alert[] = [
  {
    id: "a1",
    symbol: "BTC",
    type: "Prix atteint",
    detail: "BTC franchit $66 440",
    active: true,
  },
  {
    id: "a2",
    symbol: "ETH",
    type: "Volatilité en hausse",
    detail: "Volatilité 30j au-dessus de 55%",
    active: true,
  },
  {
    id: "a3",
    symbol: "SOL",
    type: "Configuration détectée",
    detail: "Cassure de résistance sur $185",
    active: false,
  },
  {
    id: "a4",
    symbol: "NDX",
    type: "Scénario invalidé",
    detail: "Clôture sous le support des 19 800 pts",
    active: true,
  },
  {
    id: "a5",
    symbol: "XAU",
    type: "Nouvelle analyse IA",
    detail: "Nouvelle lecture IA disponible sur l'or",
    active: false,
  },
];

function Toggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border-strong transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20",
        active ? "bg-brand/20" : "bg-surface-hover",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full transition-transform",
          active
            ? "translate-x-6 bg-brand"
            : "translate-x-1 bg-ink-faint",
        )}
      />
    </button>
  );
}

export function AlertsClient({ assets }: { assets: Asset[] }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("visitrade_alerts");
      if (raw) setAlerts(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
    markAllRead(); // opening the alerts page clears the bell
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("visitrade_alerts", JSON.stringify(alerts));
  }, [alerts, loaded]);

  // Re-sync from storage when an alert fires (the watcher updates localStorage).
  const notifs = useNotifications();
  useEffect(() => {
    try {
      const raw = localStorage.getItem("visitrade_alerts");
      if (raw) setAlerts(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifs.length]);
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? "");
  const [type, setType] = useState<AlertType>(ALERT_TYPES[0]);
  const [value, setValue] = useState("");

  const activeCount = alerts.filter((a) => a.active).length;

  function toggle(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    );
  }

  function remove(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol) return;
    const trimmed = value.trim();

    // "Prix atteint" → cible numérique réellement surveillée en direct.
    if (type === "Prix atteint") {
      const target = parseFloat(trimmed);
      if (!Number.isFinite(target) || target <= 0) return;
      const current =
        getQuoteNow(symbol)?.price ??
        assets.find((a) => a.symbol === symbol)?.price ??
        target;
      const dir: "up" | "down" = target >= current ? "up" : "down";
      setAlerts((prev) => [
        {
          id: `a-${Date.now()}`,
          symbol,
          type,
          detail: `${symbol} ${dir === "up" ? "franchit" : "passe sous"} ${formatPrice(target)}`,
          active: true,
          target,
          dir,
        },
        ...prev,
      ]);
      setValue("");
      return;
    }

    const detail = trimmed ? `${symbol} · ${trimmed}` : `${symbol} · ${type}`;
    setAlerts((prev) => [
      { id: `a-${Date.now()}`, symbol, type, detail, active: true },
      ...prev,
    ]);
    setValue("");
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader
            title="Créer une alerte"
            subtitle="Définissez la condition à surveiller."
          />
          <form onSubmit={create} className="space-y-3 px-5 pb-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Actif
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className={inputClass}
              >
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Type de condition
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AlertType)}
                className={inputClass}
              >
                {ALERT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {type === "Prix atteint" ? "Prix cible ($)" : "Valeur / condition"}
              </label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={type === "Prix atteint" ? "number" : "text"}
                step="any"
                placeholder={type === "Prix atteint" ? "ex. 70000" : "ex. volatilité > 55%"}
                className={inputClass}
              />
              {type === "Prix atteint" && (
                <p className="text-[11px] text-ink-faint">
                  Surveillé en direct — tu recevras une notification dès que le prix
                  atteint cette cible.
                </p>
              )}
            </div>
            <Button type="submit" variant="primary" className="w-full">
              <Plus className="h-4 w-4" />
              Créer l'alerte
            </Button>
          </form>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Mes alertes</h2>
          <Badge tone="brand">
            {activeCount} active{activeCount > 1 ? "s" : ""}
          </Badge>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-2.5">
            {alerts.map((a) => (
              <Card
                key={a.id}
                className={cn(
                  "flex items-center gap-3 p-4 transition-opacity",
                  !a.active && "opacity-60",
                )}
              >
                <AssetIcon symbol={a.symbol} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {a.symbol}
                    </span>
                    <Badge tone={TONE_BY_TYPE[a.type]}>{a.type}</Badge>
                    {a.triggeredAt && (
                      <Badge tone="bull">
                        <CheckCircle2 className="h-3 w-3" /> Déclenchée
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {a.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle active={a.active} onClick={() => toggle(a.id)} />
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    aria-label="Supprimer l'alerte"
                    className="rounded-lg border border-border p-2 text-ink-faint transition-colors hover:border-bear/40 hover:text-bear"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BellRing className="h-6 w-6" />}
            title="Aucune alerte pour le moment"
            description="Créez votre première alerte pour être prévenu dès qu'une condition de marché est remplie."
          />
        )}
      </div>
    </div>
  );
}
