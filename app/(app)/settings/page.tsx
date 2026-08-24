import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SettingsClient } from "@/components/app/SettingsClient";

const PLAN_LABEL: Record<string, string> = { pro: "Pro", elite: "Elite", free: "Free" };

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const upgraded = searchParams?.upgraded;
  return (
    <div>
      <PageHeader
        title="Réglages"
        subtitle="Gérez votre compte, votre abonnement et vos préférences."
      />

      {upgraded && PLAN_LABEL[upgraded] && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
          <p className="text-sm text-ink">
            <span className="font-semibold">Bienvenue dans le plan {PLAN_LABEL[upgraded]} !</span>{" "}
            Vos fonctionnalités avancées sont désormais actives.
          </p>
        </div>
      )}

      <SettingsClient />
      <Disclaimer variant="banner" className="mt-6" />
    </div>
  );
}
