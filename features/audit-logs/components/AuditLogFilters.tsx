"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { auditActionLabel } from "../labels";

const DEBOUNCE_MS = 350;
const ALL_ACTIONS = "__all__";

/** Busca livre + filtro por ação — atualiza `?search=` e `?action=` na URL. */
export function AuditLogFilters({ actions }: { actions: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const action = searchParams.get("action") ?? ALL_ACTIONS;

  const [value, setValue] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    setValue(urlSearch);
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParams(next: URLSearchParams) {
    next.delete("page");
    router.push(`/admin/audit-logs?${next}`);
  }

  function handleSearchChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (next.trim()) params.set("search", next.trim());
      else params.delete("search");
      pushParams(params);
    }, DEBOUNCE_MS);
  }

  function handleActionChange(next: string | null) {
    if (!next) return;
    const params = new URLSearchParams(searchParams);
    if (next === ALL_ACTIONS) params.delete("action");
    else params.set("action", next);
    pushParams(params);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por pessoa, ação ou entidade..."
          className="pl-8"
        />
      </div>
      <Select value={action} onValueChange={handleActionChange}>
        <SelectTrigger className="w-full max-w-[240px]">
          <SelectValue>
            {(value: string) => (value === ALL_ACTIONS ? "Todas as ações" : auditActionLabel(value))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ACTIONS}>Todas as ações</SelectItem>
          {actions.map((value) => (
            <SelectItem key={value} value={value}>
              {auditActionLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
