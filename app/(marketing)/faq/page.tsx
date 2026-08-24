import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FaqList } from "@/components/marketing/FaqList";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "FAQ — VISITRADE" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="brand" className="mb-4">FAQ</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Questions fréquentes
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Tout ce qu'il faut savoir sur VISITRADE, l'IA, les données et les abonnements.
        </p>
      </div>

      <div className="mt-14">
        <FaqList />
      </div>

      <div className="mt-12 rounded-2xl border border-brand/25 bg-brand/[0.05] p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">Une autre question ?</h2>
        <p className="mt-2 text-ink-muted">Créez un compte et explorez le produit par vous-même.</p>
        <Button href="/signup" size="md" className="mt-5">
          Commencer gratuitement <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Disclaimer variant="banner" className="mx-auto mt-10 max-w-3xl" />
    </div>
  );
}
