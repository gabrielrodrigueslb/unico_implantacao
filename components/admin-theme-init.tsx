"use client";

import { useLayoutEffect } from "react";
import { applyAdminTheme, prefersDarkTheme } from "@/lib/admin-theme";

/**
 * Aplica a preferência de tema salva assim que o shell do admin monta —
 * `useLayoutEffect` roda antes do paint, então não há flash claro→escuro.
 * Precisa ser um efeito (em vez do script inline que existia antes) porque
 * um `<script>` renderizado por um Server Component não executa quando o
 * layout monta via navegação client-side (ex.: `router.push` após login).
 */
export function AdminThemeInit() {
  useLayoutEffect(() => {
    applyAdminTheme(prefersDarkTheme());
  }, []);

  return null;
}
