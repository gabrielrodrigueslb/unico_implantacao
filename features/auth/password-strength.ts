export const STRONG_PASSWORD_MESSAGE = "Use ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo.";

export function passwordRequirements(password: string) {
  return [
    ["Ao menos 12 caracteres", password.length >= 12],
    ["Uma letra maiúscula", /[A-Z]/.test(password)],
    ["Uma letra minúscula", /[a-z]/.test(password)],
    ["Um número", /\d/.test(password)],
    ["Um símbolo", /[^A-Za-z0-9]/.test(password)],
  ] as const;
}

export function isStrongPassword(password: string) {
  return passwordRequirements(password).every(([, passed]) => passed);
}
