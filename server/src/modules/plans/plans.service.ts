import {
  clientAdminQuota,
  fetchAvailablePlans,
} from "../../integrations/atender-bem/partner-client";

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
    // O plano inclui o administrador técnico que o Atender Bem cria ao
    // provisionar a instância. O cliente só pode cadastrar o saldo.
    adminQuota: clientAdminQuota(plan.monitoringagents),
  }));
}

export const plansService = { list };
