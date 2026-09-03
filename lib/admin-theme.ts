/**
 * Tema escuro isolado do painel de admin — a classe `dark` fica só no
 * elemento `#admin-shell` (ver `app/admin/layout.tsx`), nunca no `<html>`,
 * para que onboarding/login continuem sempre claros. Constantes e helpers
 * compartilhados entre `AdminThemeInit` (aplica ao montar) e `ThemeToggle`
 * (alterna e persiste).
 */
export const ADMIN_THEME_STORAGE_KEY = "admin-theme";
export const ADMIN_SHELL_ID = "admin-shell";

export function prefersDarkTheme(): boolean {
  try {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function applyAdminTheme(dark: boolean) {
  document.getElementById(ADMIN_SHELL_ID)?.classList.toggle("dark", dark);
}
