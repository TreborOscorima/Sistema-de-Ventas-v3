import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import {
  cancelInvoice,
  emitInvoice,
  EmitInvoiceInput,
  InvoiceListFilters,
  listInvoices,
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
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelInvoice(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["electronic-invoices"] });
      toast({ title: "Comprobante anulado" });
    },
    onError: (err) =>
      toast({
        title: "Error al anular",
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
