import { Button } from "@/components/onboarding-ui/Button";
import { ArrowRight } from "lucide-react";

// Tela provisória: a versão final do boas-vindas ainda não foi desenhada.
// Mantém a mesma linguagem visual das demais etapas até isso ser definido.
export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <img src="/foguete.png" className="w-80" alt="" />
      <h1 className="text-3xl font-bold text-brand sm:text-[42px]">Vamos começar?</h1>
      <p className="max-w-md text-base text-brand/60">
        Conte pra gente um pouco sobre você e sua empresa para configurarmos sua
        instância do Único contato.
      </p>
      <Button onClick={onStart} className="mt-8 flex items-center gap-2 px-6 py-3 text-lg">
        Começar configuração <ArrowRight className=" h-4 w-4" />
      </Button>
    </div>
  );
}
