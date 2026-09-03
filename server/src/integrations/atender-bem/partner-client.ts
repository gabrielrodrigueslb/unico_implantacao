import { env } from "../../config/env";
import { AtenderBemClient } from "./atender-bem.client";

/** Um plano tal como devolvido por partner/getAllAvailablePlans (campos usados por aqui). */
export interface AtenderBemPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currencycode: string;
  /** Quantidade de atendentes (perfil "atendente" no onboarding). */
  chatagents: number;
  /** Quantidade de supervisores. */
  supervisors: number;
  /** Usado aqui como limite de administradores — a API não tem um campo
   * "admins" dedicado; ver docs/requests/puxar_planos.md. */
  monitoringagents: number;
}

let cachedClient: AtenderBemClient | null = null;

/**
 * Client autenticado com a conta de parceiro/revenda da Unico — usado só
 * para consultar o catálogo de planos, nunca para agir dentro da instância
 * de um cliente (isso é sempre feito com a conta de serviço da própria
 * implantação, ver AtenderBemClient usado em implantation.service.ts).
 */
function getPartnerClient(): AtenderBemClient {
  if (cachedClient) return cachedClient;

  const { PARTNER_ATENDERBEM_BASE_URL, PARTNER_ATENDERBEM_USERNAME, PARTNER_ATENDERBEM_PASSWORD, PARTNER_ATENDERBEM_TOTP_SECRET } =
    env;

  if (
    !PARTNER_ATENDERBEM_BASE_URL ||
    !PARTNER_ATENDERBEM_USERNAME ||
    !PARTNER_ATENDERBEM_PASSWORD ||
    !PARTNER_ATENDERBEM_TOTP_SECRET
  ) {
    throw new Error(
      "Consulta de planos indisponível: configure PARTNER_ATENDERBEM_BASE_URL, " +
        "PARTNER_ATENDERBEM_USERNAME, PARTNER_ATENDERBEM_PASSWORD e PARTNER_ATENDERBEM_TOTP_SECRET no .env",
    );
  }

  cachedClient = new AtenderBemClient({
    baseUrl: PARTNER_ATENDERBEM_BASE_URL,
    username: PARTNER_ATENDERBEM_USERNAME,
    password: PARTNER_ATENDERBEM_PASSWORD,
    totpSecret: PARTNER_ATENDERBEM_TOTP_SECRET,
  });

  return cachedClient;
}

export async function fetchAvailablePlans(): Promise<AtenderBemPlan[]> {
  return getPartnerClient().getAvailablePlans<AtenderBemPlan[]>();
}
