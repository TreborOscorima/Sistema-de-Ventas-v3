import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  category_id: string | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  category_id: string | null;
  is_active?: boolean;
  barcode?: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { activeBranch } = useCompany();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select(`*, category:categories(id, name, slug)`)
        .order("name", { ascending: true });

      if (activeBranch?.id) {
        query = query.eq("branch_id", activeBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, activeBranch?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (productData: ProductFormData) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const insertData: any = {
        name: productData.name,
        price: productData.price,
        stock: productData.stock,
        category_id: productData.category_id,
        barcode: productData.barcode || null,
        is_active: productData.is_active ?? true,
        user_id: user.id,
      };
      if (activeBranch?.id) insertData.branch_id = activeBranch.id;

      const { data, error } = await supabase
        .from("products")
        .insert(insertData)
        .select(`*, category:categories(id, name, slug)`)
        .single();

      if (error) throw error;
      
      await loadProducts();
      toast({
        title: "Producto creado",
        description: "El producto se ha creado correctamente",
      });
      return data;
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id: string, productData: Partial<ProductFormData>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("products")
        .update({
          name: productData.name,
          price: productData.price,
          stock: productData.stock,
          category_id: productData.category_id,
          barcode: productData.barcode,
          is_active: productData.is_active,
        })
        .eq("id", id);

      if (error) throw error;
      
      await loadProducts();
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await loadProducts();
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.message?.includes("foreign key") 
          ? "No se puede eliminar un producto con ventas asociadas" 
          : "No se pudo eliminar el producto",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getProductStatus = (product: Product): "active" | "low_stock" | "out_of_stock" => {
    if (product.stock === 0) return "out_of_stock";
    if (product.stock < 10) return "low_stock";
    return "active";
  };

  return {
    products,
    loading,
    saving,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStatus,
    refresh: loadProducts,
  };
}
