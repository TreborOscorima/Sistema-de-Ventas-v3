import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  supplier_id: string | null;
  document_type: string;
  document_number: string | null;
  purchase_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    ruc: string | null;
  } | null;
  items?: PurchaseItem[];
}

export interface PurchaseItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseFormData {
  supplier_id?: string | null;
  document_type: string;
  document_number?: string | null;
  purchase_date: string;
  tax?: number;
  notes?: string | null;
  items: PurchaseItemInput[];
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { activeBranch } = useCompany();

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("purchases")
        .select(`*, supplier:suppliers(id, name, ruc)`)
        .order("purchase_date", { ascending: false });

      if (activeBranch?.id) {
        query = query.eq("branch_id", activeBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPurchases((data as Purchase[]) || []);
    } catch (error) {
      console.error("Error loading purchases:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las compras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, activeBranch?.id]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const getPurchaseWithItems = async (purchaseId: string): Promise<Purchase | null> => {
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select(`*, supplier:suppliers(id, name, ruc)`)
        .eq("id", purchaseId)
        .single();

      if (purchaseError) throw purchaseError;

      const { data: items, error: itemsError } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", purchaseId);

      if (itemsError) throw itemsError;

      return { ...(purchase as Purchase), items: (items as PurchaseItem[]) || [] };
    } catch (error) {
      console.error("Error loading purchase details:", error);
      return null;
    }
  };

  const createPurchase = async (data: PurchaseFormData) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const tax = data.tax || 0;
      const total = subtotal + tax;

      const insertData: any = {
        user_id: user.id,
        supplier_id: data.supplier_id || null,
        document_type: data.document_type,
        document_number: data.document_number || null,
        purchase_date: data.purchase_date,
        subtotal,
        tax,
        total,
        notes: data.notes || null,
      };
      if (activeBranch?.id) insertData.branch_id = activeBranch.id;

      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert(insertData)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const purchaseItems = data.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      for (const item of data.items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("id", item.product_id);
        }
      }

      await loadPurchases();
      toast({
        title: "Compra registrada",
        description: "La compra se ha registrado y el inventario actualizado",
      });
      return purchase as Purchase;
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la compra",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      setSaving(true);
      
      const { data: items } = await supabase
        .from("purchase_items")
        .select("product_id, quantity")
        .eq("purchase_id", id);

      if (items) {
        for (const item of items) {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, product.stock - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }

      const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await loadPurchases();
      toast({
        title: "Compra eliminada",
        description: "La compra se ha eliminado y el inventario revertido",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting purchase:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la compra",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    purchases,
    loading,
    saving,
    createPurchase,
    deletePurchase,
    getPurchaseWithItems,
    refresh: loadPurchases,
  };
}
