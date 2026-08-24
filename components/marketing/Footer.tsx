import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { DISCLAIMER_LONG } from "@/lib/constants";

const cols = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/features" },
      { label: "Comment ça marche", href: "/how-it-works" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Assistant IA", href: "/ai" },
      { label: "Scanner", href: "/scanner" },
      { label: "Scénarios", href: "/scenarios" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Avertissement risques", href: "/legal/risques" },
      { label: "Conditions (CGU)", href: "/legal/cgu" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
      { label: "Mentions légales", href: "/legal/mentions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-base">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              L'intelligence du marché, réunie au même endroit. Analyse, scénarios
              et statistiques assistés par IA pour décider avec plus de clarté.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface/50 p-4">
          <p className="text-[11px] leading-relaxed text-ink-faint">
            <span className="font-semibold text-ink-muted">Avertissement sur les risques — </span>
            {DISCLAIMER_LONG}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-ink-faint sm:flex-row">
          <p>© 2026 VISITRADE. Tous droits réservés.</p>
          <p>Conçu pour la clarté, pas pour les promesses.</p>
        </div>
      </div>
    </footer>
  );
}
