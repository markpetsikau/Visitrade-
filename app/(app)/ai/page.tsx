import { PageHeader } from "@/components/app/PageHeader";
import { AiAssistant } from "@/components/app/AiAssistant";
import { PlanGate } from "@/components/app/PlanGate";

export const metadata = { title: "AI Assistant — VISITRADE" };

export default function AiPage() {
  return (
    <>
      <PageHeader
        title="AI Trading Assistant"
        subtitle="Analysez, comparez et comprenez les marchés — en langage clair."
      />
      <PlanGate
        feature="assistant"
        mode="replace"
        description="L'assistant IA — pour interroger les marchés en langage naturel — est réservé au plan Pro."
      >
        <AiAssistant />
      </PlanGate>
    </>
  );
}
