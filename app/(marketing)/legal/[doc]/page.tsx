import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { LEGAL_DOCS, LEGAL_ORDER } from "@/lib/legal-content";

export function generateStaticParams() {
  return LEGAL_ORDER.map((doc) => ({ doc }));
}

export function generateMetadata({ params }: { params: { doc: string } }) {
  const d = LEGAL_DOCS[params.doc];
  return { title: d ? `${d.title} — VISITRADE` : "Légal — VISITRADE" };
}

export default function LegalPage({ params }: { params: { doc: string } }) {
  const doc = LEGAL_DOCS[params.doc];
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Nav */}
        <nav className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Informations légales
          </div>
          <ul className="space-y-1">
            {LEGAL_ORDER.map((slug) => {
              const d = LEGAL_DOCS[slug];
              const active = slug === params.doc;
              return (
                <li key={slug}>
                  <Link
                    href={`/legal/${slug}`}
                    className={
                      active
                        ? "block rounded-lg bg-brand/10 px-3 py-2 text-sm font-medium text-brand"
                        : "block rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
                    }
                  >
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <article>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{doc.title}</h1>
          <p className="mt-1 text-sm text-ink-faint">Dernière mise à jour : {doc.updated}</p>

          {doc.slug === "risques" && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/[0.06] p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
              <p className="text-sm text-ink">
                Le trading comporte un risque de perte en capital. Les performances
                passées ne préjugent pas des performances futures.
              </p>
            </div>
          )}

          {doc.intro && (
            <p className="mt-6 leading-relaxed text-ink-muted">{doc.intro}</p>
          )}

          <div className="mt-8 space-y-8">
            {doc.sections.map((s) => (
              <section key={s.h}>
                <h2 className="text-lg font-semibold text-ink">{s.h}</h2>
                <div className="mt-2 space-y-2">
                  {s.body.map((p, i) => (
                    <p key={i} className="leading-relaxed text-ink-muted">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-xl border border-border bg-surface/50 p-4 text-xs text-ink-faint">
            Ce document est un modèle fourni à titre indicatif et doit être relu et
            adapté par un professionnel du droit avant tout lancement commercial.
          </p>
        </article>
      </div>
    </div>
  );
}
