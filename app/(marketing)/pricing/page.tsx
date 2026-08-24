import { Badge } from "@/components/ui/Badge";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FaqList } from "@/components/marketing/FaqList";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Check } from "lucide-react";

export const metadata = { title: "Tarifs — VISITRADE" };

const compare = [
  { label: "Prix crypto en temps réel", free: true, pro: true, elite: true },
  { label: "Aperçu d'analyse (contexte & tendance)", free: true, pro: true, elite: true },
  { label: "Analyses IA complètes", free: "1 / mois", pro: "Illimitées", elite: "Illimitées" },
  { label: "Scénarios de marché", free: false, pro: true, elite: true },
  { label: "Scanner de marché", free: false, pro: true, elite: true },
  { label: "Statistiques avancées", free: false, pro: true, elite: true },
  { label: "Assistant IA", free: false, pro: "Complet", elite: "Prioritaire" },
  { label: "Watchlist", free: "3 actifs", pro: "Illimitée", elite: "Illimitée" },
  { label: "Portfolio", free: false, pro: true, elite: true },
  { label: "Alertes", free: false, pro: "Personnalisées", elite: "Temps réel" },
  { label: "Journal + analytics", free: false, pro: false, elite: true },
  { label: "Export (CSV / API)", free: false, pro: false, elite: true },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-brand" />;
  if (v === false) return <span className="text-ink-faint">—</span>;
  return <span className="text-sm text-ink-muted">{v}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="brand" className="mb-4">Tarifs</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Un prix simple, une valeur claire
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Sans engagement. Résiliez ou changez de plan à tout moment.
        </p>
      </div>

      <div className="mt-14">
        <PricingCards />
      </div>

      {/* Comparison table */}
      <div className="mt-20 overflow-x-auto">
        <h2 className="mb-6 text-center text-2xl font-semibold text-ink">
          Comparer les plans
        </h2>
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-4 text-left text-sm font-medium text-ink-muted"></th>
              <th className="py-4 text-center text-sm font-semibold text-ink">Free</th>
              <th className="py-4 text-center text-sm font-semibold text-brand">Pro</th>
              <th className="py-4 text-center text-sm font-semibold text-ink">Elite</th>
            </tr>
          </thead>
          <tbody>
            {compare.map((row) => (
              <tr key={row.label} className="border-b border-border/60">
                <td className="py-3.5 text-sm text-ink">{row.label}</td>
                <td className="py-3.5 text-center"><Cell v={row.free} /></td>
                <td className="bg-brand/[0.03] py-3.5 text-center"><Cell v={row.pro} /></td>
                <td className="py-3.5 text-center"><Cell v={row.elite} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-20">
        <h2 className="mb-8 text-center text-2xl font-semibold text-ink">
          Questions sur l'abonnement
        </h2>
        <FaqList />
      </div>

      <Disclaimer variant="banner" className="mx-auto mt-12 max-w-3xl" />
    </div>
  );
}
