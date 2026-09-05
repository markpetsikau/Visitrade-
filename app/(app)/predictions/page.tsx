import { Info } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PredictionsBoard } from "@/components/app/PredictionsBoard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { getSession } from "@/lib/auth/session";
import { hasFeature, FREE_PREDICTION_MARKETS } from "@/lib/plans";
import { buildBoard } from "@/lib/predictions/board";

export const metadata = { title: "Prédictions — VISITRADE" };

// Cours réels à chaque affichage : jamais de mise en cache statique.
export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const session = await getSession();
  const board = await buildBoard();
  const unlimited = hasFeature(session?.plan, "predictions");

  // Le plan Free reçoit un échantillon réel ; le reste n'est pas envoyé.
  const markets = unlimited ? board.markets : board.markets.slice(0, FREE_PREDICTION_MARKETS);
  const locked = board.markets.length - markets.length;

  return (
    <>
      <PageHeader
        title="Prédictions de marché"
        subtitle="Des questions binaires datées, dont la probabilité se recalcule à chaque mouvement de prix."
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-border bg-surface-raised/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-xs leading-relaxed text-ink-muted">
          Chaque probabilité est calculée à partir du <span className="font-medium text-ink">cours réel</span> et
          de la <span className="font-medium text-ink">volatilité réalisée</span> de l&apos;actif, par un modèle
          log-normal sans dérive : il mesure la distance au seuil rapportée à l&apos;amplitude habituelle des
          mouvements, sans parier sur une direction. C&apos;est une{" "}
          <span className="font-medium text-ink">estimation statistique</span>, pas une prévision, encore moins
          une garantie — et VISITRADE ne propose ni contrat, ni pari, ni aucune prise de position.
        </p>
      </div>

      <PredictionsBoard
        initialMarkets={markets}
        initialLocked={locked}
        unlimited={unlimited}
      />

      <Disclaimer variant="banner" className="mt-6" />
    </>
  );
}
