import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import {
  cancelInvoice,
  emitInvoice,
  EmitInvoiceInput,
  InvoiceListFilters,
  listInvoices,
  retryInvoices,
  seedDefaultSeries,
} from "@/lib/invoices";

export function useInvoices(filters: InvoiceListFilters = {}) {
  const { company } = useCompany();
  return useQuery({
    queryKey: ["electronic-invoices", company?.id, filters],
    queryFn: () =>
      company ? listInvoices(company.id, filters) : Promise.resolve([]),
    enabled: !!company?.id,
  });
}

export function useEmitInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: EmitInvoiceInput) => emitInvoice(input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["electronic-invoices"] });
      qc.invalidateQueries({ queryKey: ["document-series"] });
      if (res.status === "accepted") {
        toast({
          title: "Comprobante emitido",
          description: `${res.full_number} aceptado`,
        });
      } else if (res.status === "pending") {
        toast({
          title: "Comprobante reservado",
          description:
            res.message ||
            "Pendiente de envío. Configura las credenciales fiscales.",
        });
      } else {
        toast({
          title: "Comprobante con observaciones",
          description: "Revisa el detalle en Comprobantes",
          variant: "destructive",
        });
      }
    },
    onError: (err) =>
      toast({
        title: "Error al emitir",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      force,
    }: {
      id: string;
      reason: string;
      force?: boolean;
    }) => cancelInvoice(id, reason, { force }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["electronic-invoices"] });
      if (res.pending) {
        toast({
          title: "Anulación registrada",
          description:
            res.message ||
            "Pendiente de envío al organismo fiscal. Configura las credenciales para completarla.",
        });
      } else {
        toast({
          title: "Comprobante anulado",
          description: res.message || "La anulación fue procesada correctamente.",
        });
      }
    },
    onError: (err) =>
      toast({
        title: "Error al anular",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}

export function useRetryInvoices() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (invoiceIds: string[]) => retryInvoices(invoiceIds),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["electronic-invoices"] });
      const results = res.results || [];
      const accepted = results.filter((r) => r.status === "accepted").length;
      const cancelled = results.filter((r) => r.status === "cancelled").length;
      const pending = results.filter((r) => r.pending).length;
      const failed = results.filter(
        (r) => r.ok === false && !r.pending && !r.skipped,
      ).length;
      const parts: string[] = [];
      if (accepted) parts.push(`${accepted} aceptado(s)`);
      if (cancelled) parts.push(`${cancelled} anulado(s)`);
      if (pending) parts.push(`${pending} sigue(n) pendiente(s)`);
      if (failed) parts.push(`${failed} con error`);
      toast({
        title: `Reintento procesado (${results.length})`,
        description: parts.join(" · ") || "Sin cambios",
        variant: failed > 0 ? "destructive" : "default",
      });
    },
    onError: (err) =>
      toast({
        title: "Error al reintentar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}

export function useSeedDefaultSeries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      companyId,
      country,
    }: {
      companyId: string;
      country: "PE" | "AR";
    }) => seedDefaultSeries(companyId, country),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-series"] });
      toast({
        title: "Series por defecto creadas",
        description: "Puedes ajustarlas desde la pestaña Series",
      });
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      }),
  });
}
