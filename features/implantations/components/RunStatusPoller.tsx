"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Enquanto `active` for verdadeiro (alguma implantação QUEUED/RUNNING),
 * atualiza a página em segundo plano a cada poucos segundos — assim o
 * implantador vê as etapas mudarem de status (pendente → executando →
 * concluída/falhou) sem precisar recarregar manualmente. Não renderiza nada.
 */
export function RunStatusPoller({
  active,
  intervalMs = 2500,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
