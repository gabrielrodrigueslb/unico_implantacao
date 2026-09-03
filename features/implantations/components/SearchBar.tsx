"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

const DEBOUNCE_MS = 350;

/** Busca por empresa, instância ou CNPJ (com ou sem máscara) — atualiza `?q=` na URL. */
export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(urlQuery);
  // Ajusta o campo durante o render (não em efeito) quando a URL muda por
  // fora (voltar/avançar do navegador) — evita o setState em cascata que
  // um useEffect causaria aqui.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (next.trim()) {
        params.set("q", next.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`/admin/implantations?${params}`);
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar por empresa, instância ou CNPJ..."
        className="pl-8"
      />
    </div>
  );
}
