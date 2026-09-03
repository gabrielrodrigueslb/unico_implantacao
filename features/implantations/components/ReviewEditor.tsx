"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/features/onboarding/components/FormField";
import { CompanyContactStep } from "@/features/onboarding/steps/CompanyContactStep";
import { CompanyDetailsStep } from "@/features/onboarding/steps/CompanyDetailsStep";
import { CustomersStep } from "@/features/onboarding/steps/CustomersStep";
import { QuickRepliesStep } from "@/features/onboarding/steps/QuickRepliesStep";
import { ServiceStep } from "@/features/onboarding/steps/ServiceStep";
import { TagsStep } from "@/features/onboarding/steps/TagsStep";
import { TeamStep } from "@/features/onboarding/steps/TeamStep";
import type { OnboardingData, UserQuotas } from "@/features/onboarding/types";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { updateReviewResponses } from "../api";
import { CompanySegmentPicker } from "./CompanySegmentPicker";

export function ReviewEditor({
  implantationId,
  initialData,
  userQuotas,
}: {
  implantationId: string;
  initialData: OnboardingData;
  userQuotas: UserQuotas;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  // Comparado contra um snapshot capturado localmente (não contra a prop
  // `initialData`) — depois de salvar, o servidor devolve os dados via
  // Postgres/jsonb, que não preserva a ordem original das chaves, então
  // comparar contra a prop recém-atualizada por router.refresh() geraria
  // "sujo" mesmo sem nenhuma mudança de conteúdo.
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dirty = JSON.stringify(data) !== savedSnapshot;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateReviewResponses(implantationId, data as unknown as Record<string, unknown>);
      setSavedSnapshot(JSON.stringify(data));
      setSavedAt(new Date());
      toast.success("Alterações salvas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar as alterações");
    } finally {
      setSaving(false);
    }
  }

  const companyName = data.company.tradeName || data.company.legalName;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {dirty ? (
            <Badge variant="secondary">Alterações não salvas</Badge>
          ) : savedAt ? (
            <span>Salvo às {savedAt.toLocaleTimeString("pt-BR")}</span>
          ) : (
            <span>Edite os dados enviados pelo cliente antes de aprovar</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-sm text-destructive">{error}</span>}
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
            <SaveIcon />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="service">Filas e URA</TabsTrigger>
          <TabsTrigger value="team">Usuários</TabsTrigger>
          <TabsTrigger value="customization">Etiquetas e mensagens</TabsTrigger>
          <TabsTrigger value="customers">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dados da empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyDetailsStep
                data={data.company}
                onChange={(company) => setData((d) => ({ ...d, company }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Segmento</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanySegmentPicker
                data={data.company}
                onChange={(company) => setData((d) => ({ ...d, company }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyContactStep
                data={data.company}
                onChange={(company) => setData((d) => ({ ...d, company }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.observations}
                onChange={(e) => setData((d) => ({ ...d, observations: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <ServiceStep
            data={data.service}
            onChange={(service) => setData((d) => ({ ...d, service }))}
            companyName={companyName}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamStep
            data={data.team}
            queues={data.service.queues}
            onChange={(team) => setData((d) => ({ ...d, team }))}
            userQuotas={userQuotas}
          />
        </TabsContent>

        <TabsContent value="customization" className="flex flex-col gap-8">
          <QuickRepliesStep
            data={data.customization}
            onChange={(customization) => setData((d) => ({ ...d, customization }))}
          />
          <TagsStep
            data={data.customization}
            onChange={(customization) => setData((d) => ({ ...d, customization }))}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersStep
            data={data.customers}
            onChange={(customers) => setData((d) => ({ ...d, customers }))}
          />
          {data.customers.contactImport && (
            <a
              className="mt-3 inline-block text-sm font-medium text-accent underline"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/implantations/${implantationId}/contact-import/download`}
            >
              Baixar CSV enviado
            </a>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
