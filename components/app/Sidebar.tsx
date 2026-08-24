"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Zap, LogOut } from "lucide-react";
import { useMe, PLAN_LABEL } from "@/components/app/useMe";
import { signOutAction } from "@/lib/auth/actions";

export function Sidebar() {
  const pathname = usePathname();
  const me = useMe();
  const plan = me?.plan ?? "free";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/60 lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {APP_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              )}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        {plan === "free" ? (
          <div className="rounded-xl border border-brand/25 bg-gradient-to-b from-brand/[0.08] to-transparent p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-ink">Plan Free</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              Débloquez les analyses illimitées et les scénarios complets.
            </p>
            <Link
              href="/pricing"
              className="mt-3 block rounded-lg bg-brand py-2 text-center text-xs font-semibold text-[#04110F] transition-colors hover:bg-brand-bright"
            >
              Passer au Pro
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface-raised/60 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-ink">
                Plan {PLAN_LABEL[plan]}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">Merci de votre confiance.</p>
          </div>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
