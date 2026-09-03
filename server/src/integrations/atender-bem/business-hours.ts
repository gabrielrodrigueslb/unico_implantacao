import type { AtenderBemClient } from "./atender-bem.client";

export interface BusinessHoursPeriod {
  period_order: number;
  open_time: string;
  close_time: string;
}

/** `day_of_week`: 0 = domingo ... 6 = sábado (confirmado observando o painel real). */
export interface BusinessHoursDay {
  day_of_week: number;
  is_open: number;
  periods: BusinessHoursPeriod[];
}

export interface CreateBusinessHoursConfigInput {
  name: string;
  message?: string;
  weeklySchedules: BusinessHoursDay[];
  holidayConfig: { is_open: number; message?: string; periods: BusinessHoursPeriod[] };
}

export type AtenderBemBusinessHoursConfig = { id: number } & Record<string, unknown>;

/**
 * Cria uma configuração de horário de atendimento — um recurso à parte, que
 * a fila só referencia por id (`fk_businesshours_config`). Confirmado
 * observando `POST /businesshours/configs` no painel real (não documentado
 * em docs/atenderbem-endpoints.md até este ponto).
 */
export async function createBusinessHoursConfig(
  client: AtenderBemClient,
  data: CreateBusinessHoursConfigInput,
): Promise<AtenderBemBusinessHoursConfig> {
  return client.request<AtenderBemBusinessHoursConfig>("POST", "/businesshours/configs", {
    description: "",
    message: "",
    is_active: 1,
    specialDates: [],
    ...data,
  });
}
