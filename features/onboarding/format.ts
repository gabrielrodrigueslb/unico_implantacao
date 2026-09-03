export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCNPJ(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/** Verdadeiro se o texto digitado parece um número de telefone (nenhuma letra, algum dígito). */
function looksLikePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("@") || /[a-zA-Z]/.test(trimmed)) return false;
  return onlyDigits(trimmed).length > 0;
}

/**
 * Formata o identificador de um canal (número/usuário) de acordo com o tipo:
 * WhatsApp sempre formata como telefone; Telegram detecta se o que foi digitado
 * é um número (formata) ou um usuário (deixa como está); os demais canais usam
 * usuário/link, que não tem formatação.
 */
export function formatChannelIdentifier(channel: string, value: string) {
  if (channel === "whatsapp") return formatPhone(value);
  if (channel === "telegram") return looksLikePhoneNumber(value) ? formatPhone(value) : value;
  return value;
}
