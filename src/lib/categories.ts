import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCategory(name: string): Promise<Category> {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("categories")
    .update({ name, slug })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) throw error;
  return count || 0;
}
