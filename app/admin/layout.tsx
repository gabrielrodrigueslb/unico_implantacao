import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { fetchMe } from "@/features/auth/api";
import { getAuthHeaders } from "@/lib/server-session";

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
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
