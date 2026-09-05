import { PageHeader } from "@/components/app/PageHeader";
import { AiAssistant } from "@/components/app/AiAssistant";
import { ServerPlanGate } from "@/components/app/ServerPlanGate";

export const metadata = { title: "AI Assistant — VISITRADE" };

// Dépend de la session (droits d’abonnement) → rendu à la demande.
export const dynamic = "force-dynamic";

export default function AiPage() {
  return (
    <>
      <PageHeader
        title="AI Trading Assistant"
        subtitle="Analysez, comparez et comprenez les marchés — en langage clair."
      />
      <ServerPlanGate
        feature="assistant"
        mode="replace"
        description="L'assistant IA — pour interroger les marchés en langage naturel — est réservé au plan Pro."
      >
        <AiAssistant />
      </ServerPlanGate>
    </>
  );
}
