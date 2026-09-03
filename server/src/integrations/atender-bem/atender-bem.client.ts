import { generateTotpCode } from "./atender-bem.auth";
import { AtenderBemAuthError, AtenderBemRequestError } from "./atender-bem.errors";

export interface AtenderBemClientConfig {
  /** URL da instância, ex.: https://cliente.atenderbem.com */
  baseUrl: string;
  username: string;
  password: string;
  /** Segredo base32 do TOTP da conta de serviço. */
  totpSecret: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("URL da instância inválida");
  }

  if (url.protocol !== "https:") {
    throw new Error("A URL da instância deve usar HTTPS");
  }

  if (!url.hostname.endsWith(".atenderbem.com")) {
    throw new Error("A URL da instância deve terminar em .atenderbem.com");
  }

  return url.origin;
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Concentra base URL, autenticação, Bearer Token, headers e tratamento de
 * erros para a instância do Atender Bem. Services e processors não devem
 * montar essas chamadas HTTP diretamente — usar sempre este client (ou os
 * módulos de recurso em integrations/atender-bem/*).
 *
 * O token vive só em memória nesta instância do client: nunca é persistido
 * no banco, em log ou em payload de erro.
 */
export class AtenderBemClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly totpSecret: string;
  private token: string | null = null;

  constructor(config: AtenderBemClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.username = config.username;
    this.password = config.password;
    this.totpSecret = config.totpSecret;
  }

  private async login(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
        code: generateTotpCode(this.totpSecret),
        trusted: false,
      }),
    });

    const data = (await readJsonSafely(response)) as { token?: string } | null;

    if (!response.ok || !data?.token) {
      throw new AtenderBemAuthError();
    }

    this.token = data.token;
  }

  private async send(method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  /** Executa uma chamada autenticada, relogando uma vez se a sessão expirou. */
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.token) {
      await this.login();
    }

    let response = await this.send(method, path, body);

    if (response.status === 401) {
      await this.login();
      response = await this.send(method, path, body);
    }

    const data = await readJsonSafely(response);

    if (!response.ok) {
      throw new AtenderBemRequestError(
        `Falha ao chamar ${method} ${path} na instância (HTTP ${response.status})`,
        response.status,
      );
    }

    return data as T;
  }

  async getAvailablePlans<T = unknown>(): Promise<T> {
    return this.request<T>("GET", "/partner/getAllAvailablePlans");
  }
}
