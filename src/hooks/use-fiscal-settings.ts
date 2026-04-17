import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import {
  getFiscalSettings,
  upsertFiscalSettings,
  getDocumentSeries,
  createDocumentSeries,
  updateDocumentSeries,
  deleteDocumentSeries,
  FiscalSettings,
  DocumentSeries,
} from "@/lib/fiscal";

export function useFiscalSettings() {
  const { company } = useCompany();
  return useQuery({
    queryKey: ["fiscal-settings", company?.id],
    queryFn: () => (company ? getFiscalSettings(company.id) : Promise.resolve(null)),
    enabled: !!company?.id,
  });
}

export function useUpdateFiscalSettings() {
  const { company } = useCompany();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (patch: Partial<Omit<FiscalSettings, "id" | "company_id" | "created_at" | "updated_at">>) => {
      if (!company) throw new Error("No company");
      return upsertFiscalSettings(company.id, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-settings"] });
      toast({ title: "Configuración fiscal guardada" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      });
    },
  });
}

export function useDocumentSeries() {
  const { company } = useCompany();
  return useQuery({
    queryKey: ["document-series", company?.id],
    queryFn: () => (company ? getDocumentSeries(company.id) : Promise.resolve([])),
    enabled: !!company?.id,
  });
}

export function useCreateDocumentSeries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: Omit<DocumentSeries, "id" | "created_at" | "updated_at">) =>
      createDocumentSeries(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-series"] });
      toast({ title: "Serie creada" });
    },
    onError: (err) =>
      toast({
        title: "Error al crear serie",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}

export function useUpdateDocumentSeries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<DocumentSeries> }) =>
      updateDocumentSeries(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-series"] });
      toast({ title: "Serie actualizada" });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}

export function useDeleteDocumentSeries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentSeries(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-series"] });
      toast({ title: "Serie eliminada" });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}
