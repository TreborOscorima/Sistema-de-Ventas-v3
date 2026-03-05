import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ALL_MODULES, ModuleKey } from "@/contexts/CompanyContext";

interface EmployeePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  companyId: string;
}

export function EmployeePermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  companyId,
}: EmployeePermissionsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current permissions when dialog opens
  useEffect(() => {
    if (!open || !userId) return;

    const loadPermissions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_permissions")
        .select("module")
        .eq("user_id", userId)
        .eq("company_id", companyId);

      if (data && data.length > 0) {
        setSelectedModules(data.map((p) => p.module as ModuleKey));
      } else {
        // Default cashier modules
        setSelectedModules(["pos", "caja", "reservas"]);
      }
      setLoading(false);
    };

    loadPermissions();
  }, [open, userId, companyId]);

  const toggleModule = (module: ModuleKey) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing permissions
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("company_id", companyId);

      // Insert new permissions
      if (selectedModules.length > 0) {
        const rows = selectedModules.map((module) => ({
          user_id: userId,
          company_id: companyId,
          module,
        }));
        const { error } = await supabase.from("user_permissions").insert(rows);
        if (error) throw error;
      }

      toast({ title: "Permisos actualizados", description: `Se actualizaron los permisos de ${userName}` });
      queryClient.invalidateQueries({ queryKey: ["branch-users"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos de {userName}
          </DialogTitle>
          <DialogDescription>
            Selecciona los módulos a los que este empleado tendrá acceso.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4">
            {ALL_MODULES.map((mod) => (
              <div key={mod.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`perm-${mod.key}`}
                  checked={selectedModules.includes(mod.key)}
                  onCheckedChange={() => toggleModule(mod.key)}
                />
                <Label htmlFor={`perm-${mod.key}`} className="text-sm cursor-pointer">
                  {mod.label}
                </Label>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar permisos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
