import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias — mesmo TTL do token emitido pela API.

/**
 * Espelha, na origem do painel, a sessão que a API (server/) acabou de
 * emitir no login — sem isso, nem o `proxy.ts` nem os Server Components
 * conseguem ver que o usuário está logado (o cookie da API é de outra
 * origem). Ver features/auth/api.ts (chamado logo após o login) e
 * lib/server-session.ts.
 *
 * Essa rota é alcançável cross-site sem preflight (POST simples com
 * Content-Type text/plain), então nunca grava um token sem antes validar a
 * assinatura — senão qualquer site poderia forçar o navegador da vítima a
 * gravar um JWT válido de outra conta (login CSRF / session fixation).
 */
export async function POST(request: Request) {
  const { token } = await request.json();
  if (typeof token !== "string" || !token || !verifySessionToken(token)) {
    return NextResponse.json({ message: "Token inválido" }, { status: 400 });
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
