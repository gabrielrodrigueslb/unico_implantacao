import { createHmac } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(secret: string): Buffer {
  const cleaned = secret.replace(/=+$/, "").toUpperCase();
  let bits = "";

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Gera o código TOTP (RFC 6238) da conta de serviço, usado no `code` do
 * POST /login. Deve ser chamado imediatamente antes de cada tentativa de
 * login — o código expira a cada 30 segundos.
 */
export function generateTotpCode(secret: string, timeStepSeconds = 30, digits = 6): string {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}
