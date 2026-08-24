import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/app/OnboardingWizard";

export const metadata: Metadata = {
  title: "Bienvenue — VISITRADE",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
