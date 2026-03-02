import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  name: string;
  ruc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { activeBranch } = useCompany();

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

      if (activeBranch?.id) {
        query = query.eq("branch_id", activeBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSuppliers((data as Supplier[]) || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, activeBranch?.id]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const createSupplier = async (data: SupplierFormData) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const insertData: any = { ...data, user_id: user.id };
      if (activeBranch?.id) insertData.branch_id = activeBranch.id;

      const { data: newSupplier, error } = await supabase
        .from("suppliers")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      await loadSuppliers();
      toast({
        title: "Proveedor creado",
        description: "El proveedor se ha creado correctamente",
      });
      return newSupplier as Supplier;
    } catch (error: any) {
      console.error("Error creating supplier:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el proveedor",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateSupplier = async (id: string, data: Partial<SupplierFormData>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("suppliers")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      
      await loadSuppliers();
      toast({
        title: "Proveedor actualizado",
        description: "El proveedor se ha actualizado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el proveedor",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await loadSuppliers();
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor se ha eliminado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error",
        description: error.message?.includes("foreign key") 
          ? "No se puede eliminar un proveedor con compras asociadas" 
          : "No se pudo eliminar el proveedor",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    suppliers,
    activeSuppliers: suppliers.filter(s => s.is_active),
    loading,
    saving,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refresh: loadSuppliers,
  };
}
