const INSTANCE_DOMAIN = "atenderbem.com";

/**
 * Aceita o link da instância em qualquer formato que alguém possa colar —
 * com ou sem protocolo, com ou sem o domínio ".atenderbem.com" — e devolve
 * só o subdomínio (instanceName) e a URL canônica (instanceBaseUrl).
 *
 * Exemplos válidos: "cliente", "cliente.atenderbem.com",
 * "https://cliente.atenderbem.com", "http://cliente.atenderbem.com/".
 */
export function parseInstanceUrl(raw: string): { instanceName: string; instanceBaseUrl: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Link da instância é obrigatório");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let hostname: string;
  try {
    hostname = new URL(withProtocol).hostname.toLowerCase();
  } catch {
    throw new Error("Link da instância inválido");
  }

  const instanceName = hostname.endsWith(`.${INSTANCE_DOMAIN}`)
    ? hostname.slice(0, -(INSTANCE_DOMAIN.length + 1))
    : hostname === INSTANCE_DOMAIN
      ? ""
      : hostname;

  if (!instanceName || !/^[a-z0-9-]+$/.test(instanceName)) {
    throw new Error("Não foi possível identificar o subdomínio da instância");
  }

  return {
    instanceName,
    instanceBaseUrl: `https://${instanceName}.${INSTANCE_DOMAIN}`,
  };
}
