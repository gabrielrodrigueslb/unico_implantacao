import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminThemeInit } from "@/components/admin-theme-init";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { fetchMe } from "@/features/auth/api";
import { ADMIN_SHELL_ID } from "@/lib/admin-theme";
import { getAuthHeaders } from "@/lib/server-session";

/**
 * `/admin` e tudo abaixo dele é área restrita à equipe — nunca deve aparecer
 * em buscadores. Herdado por todas as rotas filhas (users, implantations,
 * audit-logs, profile) a menos que sobrescrevam `metadata.robots`.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

/**
 * Casca compartilhada de toda a área /admin — sidebar + usuário logado. O
 * `proxy.ts` já bloqueia quem não tem sessão antes de chegar aqui; este
 * `try/catch` só cobre o caso raro de o token expirar entre o proxy e esta
 * busca.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await fetchMe(await getAuthHeaders());
  } catch {
    redirect("/login");
  }

  return (
    <SidebarProvider
      id={ADMIN_SHELL_ID}
      // `body` fica fora do shell, então resolve `text-foreground` com o
      // valor do modo claro e QUALQUER elemento aqui dentro sem cor própria
      // (h1, ícone de botão ghost, etc.) herdaria esse preto fixo. Declarar
      // a cor de novo aqui faz a herança recomeçar já considerando o `.dark`
      // deste mesmo elemento.
      className="bg-background text-foreground"
      suppressHydrationWarning
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AdminThemeInit />
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
