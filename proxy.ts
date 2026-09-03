import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/session";

/**
 * Gate de autenticação do painel: `/admin/**` exige sessão válida, `/login`
 * expulsa quem já está logado. `/onboarding` e a home ficam de fora — são
 * público (fluxo do cliente).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
