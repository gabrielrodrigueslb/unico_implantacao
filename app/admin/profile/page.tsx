import { SiteHeader } from "@/components/site-header";
import { fetchMe } from "@/features/auth/api";
import { ProfileForm } from "@/features/auth/components/ProfileForm";
import { getAuthHeaders } from "@/lib/server-session";

export default async function ProfilePage() {
  const me = await fetchMe(await getAuthHeaders());

  return (
    <>
      <SiteHeader title="Meu perfil" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="px-4 lg:px-6">
            <ProfileForm user={me} />
          </div>
        </div>
      </div>
    </>
  );
}
