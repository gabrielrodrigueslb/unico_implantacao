export function CompletionStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-selected text-2xl text-accent">
        ✓
      </span>
      <h1 className="text-3xl font-bold text-brand sm:text-[42px]">
        Recebemos suas informações!
      </h1>
      <p className="max-w-md text-base text-brand/60">
        Nossa equipe vai revisar tudo o que você enviou e iniciar a
        configuração da sua instância. Você será avisado quando a
        implantação for concluída.
      </p>
    </div>
  );
}
