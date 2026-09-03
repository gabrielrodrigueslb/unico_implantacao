export interface CnpjLookupResult {
  legalName: string;
  tradeName: string;
}

/**
 * Consulta pública de CNPJ via BrasilAPI (sem chave/autenticação).
 * Retorna null quando o CNPJ não é encontrado ou a consulta falha — nesses
 * casos o cliente preenche os dados manualmente.
 */
export async function lookupCnpj(cnpjDigits: string): Promise<CnpjLookupResult | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      legalName: data.razao_social ?? "",
      tradeName: data.nome_fantasia ?? "",
    };
  } catch {
    return null;
  }
}
