"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, TrendingUp } from "lucide-react";
import { AssetIcon } from "@/components/ui/AssetIcon";
import { ChangeBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Item {
  symbol: string;
  name: string;
  class: string;
  image: string | null;
  price: number;
  changePct24h: number;
}

export const OPEN_SEARCH_EVENT = "visitrade:open-search";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcuts: ⌘K / Ctrl+K to toggle, and a custom event from the topbar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (alive) {
          setItems(data.items ?? []);
          setActive(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, query ? 180 : 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, open]);

  const go = useCallback(
    (symbol: string) => {
      setOpen(false);
      router.push(`/markets/${symbol}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      go(items[active].symbol);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher parmi toutes les cryptos, indices, matières premières…"
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="hidden rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-ink-faint sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {loading && items.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-ink-faint">Recherche…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-ink-faint">Aucun résultat.</div>
          )}
          {items.map((it, i) => (
            <button
              key={it.symbol}
              onClick={() => go(it.symbol)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                i === active ? "bg-surface-hover" : "hover:bg-surface-raised/60",
              )}
            >
              <AssetIcon symbol={it.symbol} src={it.image ?? undefined} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{it.symbol}</div>
                <div className="truncate text-xs text-ink-faint">{it.name}</div>
              </div>
              <div className="text-right">
                <div className="tnum text-sm text-ink">{formatPrice(it.price)}</div>
                <ChangeBadge value={it.changePct24h} />
              </div>
              {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint" />}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Toutes les cryptos du marché en direct
          </span>
          <span>↑↓ naviguer · ↵ ouvrir</span>
        </div>
      </div>
    </div>
  );
}
