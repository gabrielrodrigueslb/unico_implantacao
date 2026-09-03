"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchOnboarding, isOnboardingEditable, OnboardingNotFoundError, type OnboardingRecord } from "@/features/onboarding/api";
import { MessageScreen } from "@/features/onboarding/components/MessageScreen";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import type { OnboardingData, StepId } from "@/features/onboarding/types";

type LoadState = "loading" | "notFound" | "error" | "ready";

export default function OnboardingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<LoadState>("loading");
  const [record, setRecord] = useState<OnboardingRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchOnboarding(token)
      .then((data) => {
        if (cancelled) return;
        setRecord(data);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err instanceof OnboardingNotFoundError ? "notFound" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return <MessageScreen icon="…" title="Carregando" />;
  }

  if (state === "notFound") {
    return (
      <MessageScreen
        icon="✕"
        title="Link não encontrado"
        subtitle="Confira se o endereço foi copiado corretamente."
      />
    );
  }

  if (state === "error") {
    return (
      <MessageScreen
        icon="!"
        title="Algo deu errado"
        subtitle="Não foi possível carregar suas informações agora. Tente novamente em alguns instantes."
      />
    );
  }

  if (!record || !isOnboardingEditable(record.status)) {
    return (
      <MessageScreen
        icon="✓"
        title="Recebemos suas informações!"
        subtitle="Nossa equipe vai revisar tudo o que você enviou e iniciar a configuração da sua instância. Você será avisado quando a implantação for concluída."
      />
    );
  }

  const hasSavedResponses = Object.keys(record.responses).length > 0;

  return (
    <OnboardingWizard
      token={token}
      initialStep={record.currentStep as StepId | null}
      initialData={hasSavedResponses ? (record.responses as OnboardingData) : undefined}
      userQuotas={record.userQuotas}
    />
  );
}
