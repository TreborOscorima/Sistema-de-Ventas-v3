import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import {
  getPaymentMethods,
  togglePaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from "@/lib/payment-methods";

export function usePaymentMethods() {
  const { company } = useCompany();
  return useQuery({
    queryKey: ['payment-methods', company?.id],
    queryFn: () => getPaymentMethods(company!.id),
    enabled: !!company?.id,
  });
}

export function useActivePaymentMethods() {
  const { data: methods, ...rest } = usePaymentMethods();
  return {
    ...rest,
    data: methods?.filter(m => m.is_active) || [],
  };
}

export function useTogglePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      togglePaymentMethod(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  const { company } = useCompany();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ name, key, icon }: { name: string; key: string; icon?: string }) =>
      createPaymentMethod(company!.id, name, key, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: "Método creado", description: "El método de pago se ha agregado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: "Método eliminado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; name?: string; icon?: string }) =>
      updatePaymentMethod(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}
