"use client";

import { useEffect, useState } from "react";
import { ADMIN_SHELL_ID } from "@/lib/admin-theme";

/**
 * Menus, selects, tooltips e sheets (Base UI) fazem portal pra `document.body`
 * por padrão — fora do `#admin-shell`, então fora do escopo da classe `dark`
 * (que só está no shell, nunca no `<html>`). Resultado: popup sempre claro
 * mesmo com o admin em modo escuro. Passar o retorno daqui como `container`
 * mantém o portal dentro do shell.
 *
 * Fora do admin (onboarding/login) o elemento não existe, então o hook
 * devolve `undefined` e o componente cai no comportamento padrão
 * (`document.body`) sem qualquer mudança.
 */
export function useAdminPortalContainer(): HTMLElement | undefined {
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const shell = document.getElementById(ADMIN_SHELL_ID);
    if (shell) setContainer(shell);
  }, []);

  return container;
}
