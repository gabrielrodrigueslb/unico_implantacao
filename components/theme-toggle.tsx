"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_SHELL_ID, ADMIN_THEME_STORAGE_KEY, applyAdminTheme } from "@/lib/admin-theme";
import { cn } from "@/lib/utils";

/**
 * Alterna a classe `dark` só no shell do admin (`#admin-shell`, ver
 * `app/admin/layout.tsx`) — não no `<html>` — para que o tema escuro nunca
 * vaze para onboarding/login. Ícone é puro CSS (`dark:` do próprio shell),
 * sem estado em React, então não há flash/mismatch de hidratação.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const shell = document.getElementById(ADMIN_SHELL_ID);
    if (!shell) return;
    const isDark = !shell.classList.contains("dark");
    applyAdminTheme(isDark);
    try {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // localStorage indisponível (modo privado etc.) — só não persiste.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      className={cn("size-8", className)}
    >
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </Button>
  );
}
