import type { MetadataRoute } from "next";

/**
 * `/admin` (painel interno) e `/login` nunca devem ser rastreados — só o
 * onboarding (fluxo do cliente) e a home são públicos. Isso é uma camada a
 * mais de defesa: as próprias páginas também respondem `noindex, nofollow`
 * (ver `app/admin/layout.tsx` e `app/login/layout.tsx`).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/login"],
    },
  };
}
