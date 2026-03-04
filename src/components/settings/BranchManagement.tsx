import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompany, Branch, AppRole } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Trash2, Users, Loader2, MapPin, Phone, Mail, UserPlus, UserMinus } from "lucide-react";

interface BranchUser {
  user_id: string;
  branch_id: string;
  is_active: boolean;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  role?: AppRole;
}

export function BranchManagement() {
  const { company, branches, userRole, refreshCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Employee assignment state
  const [assignDialog, setAssignDialog] = useState<Branch | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<AppRole>("cashier");
  const [assigning, setAssigning] = useState(false);

  const isOwner = userRole === "owner";

  // Fetch branch users
  const { data: branchUsersMap = {}, isLoading: loadingUsers } = useQuery({
    queryKey: ["branch-users", company?.id],
    queryFn: async () => {
      if (!company) return {};

      const result: Record<string, BranchUser[]> = {};

      for (const branch of branches) {
        const { data: branchUsers } = await supabase
          .from("branch_users")
          .select("user_id, branch_id, is_active")
          .eq("branch_id", branch.id)
          .eq("is_active", true);

        if (branchUsers && branchUsers.length > 0) {
          const userIds = branchUsers.map((bu) => bu.user_id);

          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", userIds);

          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .eq("company_id", company.id)
            .in("user_id", userIds);

          result[branch.id] = branchUsers.map((bu) => ({
            ...bu,
            profile: profiles?.find((p) => p.user_id === bu.user_id) || undefined,
            role: (roles?.find((r) => r.user_id === bu.user_id)?.role as AppRole) || undefined,
          }));
        } else {
          result[branch.id] = [];
        }
      }

      return result;
    },
    enabled: !!company && branches.length > 0,
  });

  const resetForm = () => {
    setBranchName("");
    setBranchAddress("");
    setBranchPhone("");
    setBranchEmail("");
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchAddress(branch.address || "");
    setBranchPhone(branch.phone || "");
    setBranchEmail(branch.email || "");
  };

  const handleCreateBranch = async () => {
    if (!company || !branchName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("branches").insert({
        company_id: company.id,
        name: branchName.trim(),
        address: branchAddress.trim() || null,
        phone: branchPhone.trim() || null,
        email: branchEmail.trim() || null,
      });
      if (error) throw error;

      toast({ title: "Sucursal creada", description: `"${branchName}" se creó correctamente` });
      setShowCreateDialog(false);
      resetForm();
      await refreshCompany();
      queryClient.invalidateQueries({ queryKey: ["branch-users"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch || !branchName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("branches")
        .update({
          name: branchName.trim(),
          address: branchAddress.trim() || null,
          phone: branchPhone.trim() || null,
          email: branchEmail.trim() || null,
        })
        .eq("id", editingBranch.id);
      if (error) throw error;

      toast({ title: "Sucursal actualizada" });
      setEditingBranch(null);
      resetForm();
      await refreshCompany();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    try {
      const { error } = await supabase
        .from("branches")
        .update({ is_active: false })
        .eq("id", branch.id);
      if (error) throw error;

      toast({ title: "Sucursal eliminada", description: `"${branch.name}" fue desactivada` });
      await refreshCompany();
      queryClient.invalidateQueries({ queryKey: ["branch-users"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAssignEmployee = async () => {
    if (!assignDialog || !assignEmail.trim() || !company) return;
    setAssigning(true);
    try {
      // Find user by email in profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", assignEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) {
        toast({ title: "Usuario no encontrado", description: "No se encontró una cuenta con ese correo electrónico.", variant: "destructive" });
        setAssigning(false);
        return;
      }

      // Check if user already has a role in this company
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("company_id", company.id)
        .maybeSingle();

      if (!existingRole) {
        // Assign role in company
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: profile.user_id, company_id: company.id, role: assignRole });
        if (roleErr) throw roleErr;
      }

      // Check if already assigned to this branch
      const { data: existingBU } = await supabase
        .from("branch_users")
        .select("id, is_active")
        .eq("user_id", profile.user_id)
        .eq("branch_id", assignDialog.id)
        .maybeSingle();

      if (existingBU) {
        if (existingBU.is_active) {
          toast({ title: "Ya asignado", description: "Este usuario ya está asignado a esta sucursal." });
          setAssigning(false);
          return;
        }
        // Reactivate
        await supabase.from("branch_users").update({ is_active: true }).eq("id", existingBU.id);
      } else {
        const { error: buErr } = await supabase
          .from("branch_users")
          .insert({ user_id: profile.user_id, branch_id: assignDialog.id });
        if (buErr) throw buErr;
      }

      toast({ title: "Empleado asignado", description: `Se asignó el empleado a "${assignDialog.name}"` });
      setAssignEmail("");
      setAssignRole("cashier");
      queryClient.invalidateQueries({ queryKey: ["branch-users"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveEmployee = async (branchId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("branch_users")
        .update({ is_active: false })
        .eq("branch_id", branchId)
        .eq("user_id", userId);
      if (error) throw error;

      toast({ title: "Empleado removido" });
      queryClient.invalidateQueries({ queryKey: ["branch-users"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getRoleBadge = (role?: AppRole) => {
    switch (role) {
      case "owner":
        return <Badge variant="default">Dueño</Badge>;
      case "admin":
        return <Badge variant="secondary">Admin</Badge>;
      case "cashier":
        return <Badge variant="outline">Cajero</Badge>;
      default:
        return <Badge variant="outline">Sin rol</Badge>;
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Solo el dueño puede gestionar las sucursales.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branch List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sucursales
            </CardTitle>
            <CardDescription>Gestiona las sucursales de tu empresa</CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva sucursal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nueva sucursal</DialogTitle>
                <DialogDescription>Agrega una nueva sucursal a tu empresa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Sucursal Norte" />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Calle 123" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} placeholder="+54 11..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={branchEmail} onChange={(e) => setBranchEmail(e.target.value)} placeholder="sucursal@..." />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateBranch} disabled={saving || !branchName.trim()} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear sucursal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No hay sucursales</p>
          ) : (
            <div className="space-y-4">
              {branches.map((branch) => (
                <Card key={branch.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          {branch.address && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{branch.address}</span>
                          )}
                          {branch.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{branch.phone}</span>
                          )}
                          {branch.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{branch.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(branch)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar sucursal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La sucursal "{branch.name}" será desactivada. Los datos no se eliminarán.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBranch(branch)}>Desactivar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" /> Empleados asignados
                      </h4>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setAssignDialog(branch); setAssignEmail(""); }}>
                        <UserPlus className="h-3 w-3" /> Asignar
                      </Button>
                    </div>
                    {loadingUsers ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (branchUsersMap[branch.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Sin empleados asignados</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(branchUsersMap[branch.id] || []).map((bu) => (
                            <TableRow key={bu.user_id}>
                              <TableCell>{bu.profile?.full_name || "—"}</TableCell>
                              <TableCell>{bu.profile?.email || "—"}</TableCell>
                              <TableCell>{getRoleBadge(bu.role)}</TableCell>
                              <TableCell>
                                {bu.role !== "owner" && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveEmployee(branch.id, bu.user_id)}>
                                    <UserMinus className="h-3 w-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingBranch} onOpenChange={(open) => { if (!open) { setEditingBranch(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={branchEmail} onChange={(e) => setBranchEmail(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateBranch} disabled={saving || !branchName.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) setAssignDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar empleado a "{assignDialog?.name}"</DialogTitle>
            <DialogDescription>
              Ingresa el correo electrónico de un usuario registrado para asignarlo a esta sucursal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Correo electrónico del empleado</Label>
              <Input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="empleado@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={assignRole} onValueChange={(v) => setAssignRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAssignEmployee} disabled={assigning || !assignEmail.trim()} className="gap-2">
              {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
              Asignar empleado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
