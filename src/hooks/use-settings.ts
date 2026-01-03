import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusinessSettings, upsertBusinessSettings, updateUserProfile, updateUserPassword, BusinessSettings } from "@/lib/settings";
import { useToast } from "@/hooks/use-toast";

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: getBusinessSettings,
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: Partial<Omit<BusinessSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
      upsertBusinessSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la configuración",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUserProfile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { full_name?: string; email?: string }) =>
      updateUserProfile(data),
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el perfil",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      updateUserPassword(currentPassword, newPassword),
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha cambiado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar la contraseña",
        variant: "destructive",
      });
    },
  });
}
