"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { APP_NAV } from "@/lib/constants";
import { DataSourceTag } from "@/components/ui/DataSourceTag";
import { useUnreadCount } from "@/components/app/notifications";
import { useMe } from "@/components/app/useMe";
import { OPEN_SEARCH_EVENT } from "@/components/app/CommandPalette";
import { cn } from "@/lib/utils";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const me = useMe();
  const unread = useUnreadCount();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-base/80 px-4 backdrop-blur-xl lg:px-6">
      <button
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-raised lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        className="relative hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 text-left text-sm text-ink-faint transition-colors hover:border-brand/40 sm:flex sm:h-9"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Rechercher un actif…</span>
        <kbd className="rounded border border-border-strong px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <button
        onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-raised sm:hidden"
        aria-label="Rechercher"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <DataSourceTag className="hidden md:inline-flex" />
        <Link
          href="/alerts"
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-raised"
          aria-label="Alertes"
        >
          <span className="relative">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-[#04110F]">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </span>
        </Link>
        <Link
          href="/settings"
          className="grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand"
          title={me?.name}
        >
          {me?.initials ?? "··"}
        </Link>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface p-3">
            <div className="flex h-12 items-center justify-between px-2">
              <Logo />
              <button onClick={() => setOpen(false)} className="text-ink-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-2 space-y-0.5">
              {APP_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                      active ? "bg-brand/10 text-brand" : "text-ink-muted hover:bg-surface-raised",
                    )}
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
