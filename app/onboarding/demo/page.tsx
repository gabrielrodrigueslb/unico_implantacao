import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

/**
 * Onboarding de demonstração — sem `token`, então o wizard nunca chama o
 * backend (nem autosave, nem envio final). Usado só para mostrar o fluxo
 * sem depender de uma implantação real. Links de cliente de verdade usam
 * /onboarding/[token], que busca e persiste no backend.
 */
export default function OnboardingDemoPage() {
  return <OnboardingWizard />;
}
