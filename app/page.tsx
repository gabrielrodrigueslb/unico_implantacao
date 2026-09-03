import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <Image
        src="/logounico_azul.svg"
        alt="Unico"
        width={160}
        height={48}
        priority
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-brand">
          Unico Implantação
        </h1>
        <p className="max-w-sm text-sm text-brand/60">
          Painel administrativo e onboarding de implantação do Atender Bem.
        </p>
      </div>
      <Link
        href="/onboarding/demo"
        className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand/90"
      >
        Ver onboarding de exemplo
      </Link>
    </div>
  );
}
