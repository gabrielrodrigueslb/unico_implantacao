import { fetchAvailablePlans } from "../../integrations/atender-bem/partner-client";

/**
 * Enxuga o plano da API do Atender Bem para só o que a criação de
 * implantação precisa: identificação e os três limites de usuário.
 */
async function list() {
  const plans = await fetchAvailablePlans();

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currencyCode: plan.currencycode,
    agentQuota: plan.chatagents,
    supervisorQuota: plan.supervisors,
    adminQuota: plan.monitoringagents,
  }));
}

export const plansService = { list };
