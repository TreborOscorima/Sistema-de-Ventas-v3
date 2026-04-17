import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  useDocumentSeries, useCreateDocumentSeries, useUpdateDocumentSeries, useDeleteDocumentSeries,
} from "@/hooks/use-fiscal-settings";
import { useCompany } from "@/contexts/CompanyContext";
import {
  AR_DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, FiscalCountry, FiscalDocumentType, PE_DOCUMENT_TYPES,
} from "@/lib/fiscal";

interface Props { country: FiscalCountry }

const SUGGESTED_PREFIX: Partial<Record<FiscalDocumentType, string>> = {
  pe_boleta: "B001",
  pe_factura: "F001",
  pe_nota_credito: "FC01",
  pe_nota_debito: "FD01",
  pe_guia_remision: "T001",
};

export function DocumentSeriesManager({ country }: Props) {
  const { company } = useCompany();
  const { data: series = [], isLoading } = useDocumentSeries();
  const create = useCreateDocumentSeries();
  const update = useUpdateDocumentSeries();
  const remove = useDeleteDocumentSeries();

  const types = country === "PE" ? PE_DOCUMENT_TYPES : AR_DOCUMENT_TYPES;
  const filtered = series.filter((s) => types.includes(s.document_type));

  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<FiscalDocumentType>(types[0]);
  const [seriesValue, setSeriesValue] = useState("");
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isDefault, setIsDefault] = useState(true);

  const handleCreate = async () => {
    if (!company || !seriesValue) return;
    await create.mutateAsync({
      company_id: company.id,
      branch_id: null,
      document_type: docType,
      series: seriesValue.toUpperCase(),
      current_number: currentNumber,
      is_active: true,
      is_default: isDefault,
    });
    setOpen(false);
    setSeriesValue("");
    setCurrentNumber(0);
  };

  const handleSelectType = (t: string) => {
    const tt = t as FiscalDocumentType;
    setDocType(tt);
    if (country === "PE" && SUGGESTED_PREFIX[tt]) setSeriesValue(SUGGESTED_PREFIX[tt]!);
    else if (country === "AR") setSeriesValue("0001");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Series y correlativos</CardTitle>
            <CardDescription>
              Define las series y números correlativos para cada tipo de comprobante.
              {country === "PE" && " En Perú: Boleta usa B001, Factura F001, etc."}
              {country === "AR" && " En Argentina: el número de serie corresponde al punto de venta (4 dígitos)."}
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Nueva serie</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nueva serie</DialogTitle>
                <DialogDescription>
                  Cada tipo de comprobante puede tener varias series con su propio correlativo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Tipo de comprobante</Label>
                  <Select value={docType} onValueChange={handleSelectType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serie</Label>
                  <Input
                    value={seriesValue}
                    onChange={(e) => setSeriesValue(e.target.value.toUpperCase())}
                    placeholder={country === "PE" ? "F001 / B001" : "0001"}
                    maxLength={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número correlativo actual</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currentNumber}
                    onChange={(e) => setCurrentNumber(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    El próximo comprobante se emitirá con el número {currentNumber + 1}.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Marcar como serie por defecto</Label>
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={create.isPending || !seriesValue}>
                  {create.isPending ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No hay series configuradas. Crea la primera para empezar a emitir comprobantes.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Serie</TableHead>
                <TableHead>Último número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Por defecto</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{DOCUMENT_TYPE_LABELS[s.document_type]}</TableCell>
                  <TableCell><Badge variant="outline">{s.series}</Badge></TableCell>
                  <TableCell className="font-mono">{String(s.current_number).padStart(8, "0")}</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) =>
                        update.mutate({ id: s.id, patch: { is_active: v } })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_default}
                      onCheckedChange={(v) =>
                        update.mutate({ id: s.id, patch: { is_default: v } })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar la serie {s.series}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Solo puedes eliminar series sin comprobantes emitidos. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(s.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
