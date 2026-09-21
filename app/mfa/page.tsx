import { Suspense } from "react";
import { MfaForm } from "@/components/app/MfaForm";

export const metadata = { title: "Vérification — VISITRADE" };

export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <MfaForm />
    </Suspense>
  );
}
