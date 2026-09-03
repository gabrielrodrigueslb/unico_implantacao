"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/api";
import { LockIcon, MailIcon, ShieldCheckIcon } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push(searchParams.get("next") || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca — só em telas maiores, o login sozinho já se sustenta no mobile. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 10%, color-mix(in oklch, var(--accent) 35%, transparent), transparent 55%), radial-gradient(circle at 85% 90%, color-mix(in oklch, var(--accent) 25%, transparent), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <Image src="/logounico_branca.svg" alt="Único" width={130} height={39} className="relative" />

        <div className="relative flex flex-col gap-4">
          
          <h1 className="max-w-md text-3xl font-bold text-balance">
            Implantação de instâncias, do onboarding à automação.
          </h1>
          <p className="max-w-sm text-sm text-white/60">
            Acompanhe solicitações, revise onboardings e conduza a implantação de cada cliente da Unico Contato em um só lugar.
          </p>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Grupo Único</p>
      </div>

      {/* Formulário */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <Image
            src="/logounico_azul.svg"
            alt="Único"
            width={120}
            height={36}
            className="mb-10 lg:hidden"
          />

          <div className="mb-8 flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-foreground">Painel de Implantações</h2>
            <p className="text-sm text-muted-foreground">Entre com sua conta da Único Contato.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@unicocontato.com.br"
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-1 h-10">
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
