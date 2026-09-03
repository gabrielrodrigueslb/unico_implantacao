import { SiteHeader } from "@/components/site-header";
import { fetchMe } from "@/features/auth/api";
import { fetchUsers } from "@/features/users/api";
import { UserFormSheet } from "@/features/users/components/UserFormSheet";
import { UsersTable } from "@/features/users/components/UsersTable";
import { getAuthHeaders } from "@/lib/server-session";

export default async function UsersPage() {
  const headers = await getAuthHeaders();
  const me = await fetchMe(headers);

  if (me.role !== "ADMIN") {
    return (
      <>
        <SiteHeader title="Usuários" />
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Só administradores podem gerenciar usuários do painel.
        </div>
      </>
    );
  }

  const users = await fetchUsers(headers);

  return (
    <>
      <SiteHeader title="Usuários" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
            <p className="text-sm text-muted-foreground">
              Contas com acesso ao painel administrativo.
            </p>
            <UserFormSheet />
          </div>
          <div className="px-4 lg:px-6">
            <UsersTable users={users} currentUserId={me.id} />
          </div>
        </div>
      </div>
    </>
  );
}
