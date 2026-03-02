import { useState, useEffect, useCallback } from "react";
import { 
  Category, 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryProductCount 
} from "@/lib/categories";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

interface CategoryWithCount extends Category {
  productCount: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeBranch } = useCompany();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories(activeBranch?.id);
      
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const productCount = await getCategoryProductCount(category.id);
          return { ...category, productCount };
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, activeBranch?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (name: string) => {
    if (!user) return false;
    try {
      setSaving(true);
      await createCategory(user.id, name, activeBranch?.id);
      await loadCategories();
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") 
          ? "Ya existe una categoría con ese nombre" 
          : "No se pudo crear la categoría",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const editCategory = async (id: string, name: string) => {
    try {
      setSaving(true);
      await updateCategory(id, name);
      await loadCategories();
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") 
          ? "Ya existe una categoría con ese nombre" 
          : "No se pudo actualizar la categoría",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    try {
      setSaving(true);
      await deleteCategory(id);
      await loadCategories();
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.message?.includes("foreign key") 
          ? "No se puede eliminar una categoría con productos asociados" 
          : "No se pudo eliminar la categoría",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    loading,
    saving,
    addCategory,
    editCategory,
    removeCategory,
    refresh: loadCategories,
  };
}
