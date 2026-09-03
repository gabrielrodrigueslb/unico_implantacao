export class AtenderBemError extends Error {}

export class AtenderBemAuthError extends AtenderBemError {
  constructor(message = "Falha ao autenticar na instância do Atender Bem") {
    super(message);
  }
}

export class AtenderBemRequestError extends AtenderBemError {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Lançado para operações cujo endpoint de escrita ainda não foi confirmado
 * com segurança (ver docs/atenderbem-endpoints.md). Bloquear em vez de
 * adivinhar a rota evita corromper dados reais do cliente.
 */
export class AtenderBemUnsupportedOperationError extends AtenderBemError {
  constructor(operation: string) {
    super(
      `Endpoint de escrita ainda não confirmado para: ${operation}. ` +
        "Consulte docs/atenderbem-endpoints.md antes de habilitar esta etapa.",
    );
  }
}
