import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = Buffer.from(env.CREDENTIALS_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY deve decodificar para 32 bytes (AES-256)");
  }
  return key;
}

/** Cifra um segredo (senha, TOTP) para armazenamento em repouso. */
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
    ":",
  );
}

/** Decifra um valor gerado por encryptSecret. Nunca logar o retorno. */
export function decryptSecret(cipherText: string): string {
  const [ivBase64, authTagBase64, encryptedBase64] = cipherText.split(":");
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Formato de segredo cifrado inválido");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
