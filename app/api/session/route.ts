import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias — mesmo TTL do token emitido pela API.

/**
 * Espelha, na origem do painel, a sessão que a API (server/) acabou de
 * emitir no login — sem isso, nem o `proxy.ts` nem os Server Components
 * conseguem ver que o usuário está logado (o cookie da API é de outra
 * origem). Ver features/auth/api.ts (chamado logo após o login) e
 * lib/server-session.ts.
 */
export async function POST(request: Request) {
  const { token } = await request.json();
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ message: "Token ausente" }, { status: 400 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
