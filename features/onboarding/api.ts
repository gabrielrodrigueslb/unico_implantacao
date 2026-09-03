import type { OnboardingData, StepId, UserQuotas } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface OnboardingRecord {
  companyName: string | null;
  status: string;
  currentStep: StepId | null;
  responses: Partial<OnboardingData>;
  submittedAt: string | null;
  userQuotas: UserQuotas;
}

/** Link inválido ou implantação inexistente — nunca expor detalhes internos por cima disso. */
export class OnboardingNotFoundError extends Error {}

export async function fetchOnboarding(token: string): Promise<OnboardingRecord> {
  const response = await fetch(`${API_BASE_URL}/onboarding/${token}`);
  if (response.status === 404) throw new OnboardingNotFoundError();
  if (!response.ok) throw new Error("Não foi possível carregar o onboarding");
  return response.json();
}

export async function saveOnboardingProgress(
  token: string,
  currentStep: StepId,
  responses: OnboardingData,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/onboarding/${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentStep, responses }),
  });
  if (!response.ok) throw new Error("Não foi possível salvar o progresso");
}

export async function submitOnboarding(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/onboarding/${token}/submit`, { method: "POST" });
  if (!response.ok) throw new Error("Não foi possível enviar o onboarding");
}

/** Espelha EDITABLE_STATUSES do backend — status em que o cliente ainda pode preencher/editar. */
export function isOnboardingEditable(status: string): boolean {
  return status === "ONBOARDING_PENDING" || status === "ONBOARDING_IN_PROGRESS";
}
