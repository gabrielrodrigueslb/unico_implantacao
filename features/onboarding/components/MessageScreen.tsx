import Image from "next/image";

/**
 * Tela genérica para estados fora do fluxo normal do wizard (carregando,
 * link inválido, erro). Nunca expor detalhes internos aqui — é a primeira
 * coisa que o cliente vê, e o link não pode dar nenhuma pista do sistema
 * administrativo por trás.
 */
export function MessageScreen({
  title,
  subtitle,
  icon = "•",
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-hairline">
        <div className="flex items-center px-6 py-4 sm:px-[70px] sm:py-[18px]">
          <Image src="/logounico_azul.svg" alt="Unico" width={110} height={33} />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-selected text-2xl text-accent">
          {icon}
        </span>
        <h1 className="text-3xl font-bold text-brand sm:text-[42px]">{title}</h1>
        {subtitle ? <p className="max-w-md text-base text-brand/60">{subtitle}</p> : null}
      </main>
    </div>
  );
}
