"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { fullOnboardingLink } from "../api";

export function CopyLinkButton({ onboardingToken }: { onboardingToken: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullOnboardingLink(onboardingToken));
      toast.success("Link de onboarding copiado");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
      {copied ? "Copiado!" : "Copiar link"}
    </Button>
  );
}
