"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notif {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

const KEY = "visitrade_notifs";
let items: Notif[] = [];
let loaded = false;
let version = 0;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  try {
    items = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    items = [];
  }
  loaded = true;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* ignore */
  }
}
function bump() {
  version++;
  subs.forEach((f) => f());
}

export function addNotification(title: string, body: string) {
  load();
  items = [{ id: `n-${Date.now()}-${Math.round(performance.now())}`, title, body, at: Date.now(), read: false }, ...items];
  save();
  bump();
}
export function markAllRead() {
  load();
  items = items.map((n) => ({ ...n, read: true }));
  save();
  bump();
}
export function getNotifications() {
  load();
  return items;
}

export function useNotifications() {
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => version,
    () => 0,
  );

  // Le serveur ne connaît pas le stockage local : lire les notifications
  // pendant le premier rendu client faisait diverger le HTML (React jetait
  // alors tout l'arbre). On ne les révèle qu'après le montage.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load();
    setReady(true);
  }, []);

  return ready ? items : [];
}

export function useUnreadCount() {
  const list = useNotifications();
  return list.filter((n) => !n.read).length;
}

// Transient toasts for the most recent notifications.
export function Toaster() {
  const list = useNotifications();
  const [shown, setShown] = useState<Notif[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show toasts for notifications from the last 8 seconds not yet dismissed.
    const recent = list.filter(
      (n) => Date.now() - n.at < 8000 && !dismissed.has(n.id),
    );
    setShown(recent.slice(0, 3));
    if (recent.length) {
      const t = setTimeout(() => {
        setDismissed((d) => {
          const next = new Set(d);
          recent.forEach((n) => next.add(n.id));
          return next;
        });
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [list, dismissed]);

  if (!shown.length) return null;

  return (
    <div className="fixed right-4 top-20 z-[110] flex w-full max-w-xs flex-col gap-2">
      {shown.map((n) => (
        <div
          key={n.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border border-brand/30 bg-surface/95 p-3 shadow-2xl backdrop-blur-xl",
          )}
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{n.title}</div>
            <div className="text-xs text-ink-muted">{n.body}</div>
          </div>
          <button
            onClick={() => setDismissed((d) => new Set(d).add(n.id))}
            className="text-ink-faint hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
