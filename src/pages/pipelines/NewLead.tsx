import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useLeadValidation } from "@/hooks/useLeadValidation";
import { useCreateLead } from "@/hooks/useCreateLead";
import { isAdminOrEnablement } from "@/lib/rbac/permissions";
import { LeadValidationAlert } from "@/components/LeadValidationAlert";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";

const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Nome é obrigatório").max(200),
  email: z.string().trim().email("E-mail inválido").max(255).or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  document: z.string().trim().max(30).optional(),
  companyName: z.string().trim().max(200).optional(),
  source: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function NewLead() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { data: profile } = useCurrentProfile();
  const { duplicates, isChecking, checkDuplicates, clearDuplicates } = useLeadValidation();
  const createLead = useCreateLead();
  const [showDuplicates, setShowDuplicates] = useState(false);

  const pipelineQuery = useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, business_units(name, id)")
        .eq("id", pipelineId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pipelineId,
  });

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      document: "",
      companyName: "",
      source: "",
      notes: "",
    },
  });

  const pipeline = pipelineQuery.data;
  const bu = pipeline?.business_units as any;
  const canOverride = isAdminOrEnablement(profile?.role ?? null);

  const doCreate = async (values: LeadFormValues, force = false) => {
    if (!profile || !pipeline || !pipelineId) return;

    if (!force) {
      const found = await checkDuplicates(
        profile.organizationId,
        values.email,
        values.phone,
        values.document
      );
      if (found.length > 0) {
        setShowDuplicates(true);
        return;
      }
    }

    setShowDuplicates(false);
    const result = await createLead.mutateAsync({
      pipelineId,
      organizationId: profile.organizationId,
      businessUnitId: bu?.id ?? profile.businessUnitId ?? "",
      fullName: values.fullName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      document: values.document || undefined,
      companyName: values.companyName || undefined,
      source: values.source || undefined,
    });

    navigate(`/pipelines/${pipelineId}/cards/${result.id}`);
  };

  const onSubmit = (values: LeadFormValues) => doCreate(values);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Lead</h1>
            <p className="text-sm text-muted-foreground">
              {pipeline?.name} {bu?.name && `· ${bu.name}`}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do lead" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: site, indicação, evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showDuplicates && duplicates.length > 0 && (
                  <LeadValidationAlert
                    duplicates={duplicates}
                    canOverride={canOverride}
                    onOverride={() => doCreate(form.getValues(), true)}
                    onCancel={() => {
                      setShowDuplicates(false);
                      clearDuplicates();
                    }}
                  />
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLead.isPending || isChecking}
                  >
                    {(createLead.isPending || isChecking) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    )}
                    Criar Lead
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
