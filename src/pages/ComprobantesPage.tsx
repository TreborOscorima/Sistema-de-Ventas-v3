import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, FileText, Download, Ban, Search, FilePlus, FileMinus, Printer, RefreshCw } from "lucide-react";
import { useInvoices, useCancelInvoice, useRetryInvoices } from "@/hooks/use-invoices";
import { useFiscalSettings } from "@/hooks/use-fiscal-settings";
import { useBusinessSettings } from "@/hooks/use-settings";
import { printFiscalReceipt } from "@/lib/fiscal-pdf";
import { useToast } from "@/hooks/use-toast";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  type ElectronicInvoice,
  type FiscalDocumentType,
  type InvoiceStatus,
} from "@/lib/fiscal";
import { IssueNoteDialog } from "@/components/invoices/IssueNoteDialog";
import { useCompany } from "@/contexts/CompanyContext";
import { formatCurrency } from "@/lib/currency";

export default function ComprobantesPage() {
  const { company } = useCompany();
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [docType, setDocType] = useState<FiscalDocumentType | "all">("all");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    full: string;
    country: "PE" | "AR";
  } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelForce, setCancelForce] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{
    invoice: ElectronicInvoice;
    kind: "credit" | "debit";
  } | null>(null);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      document_type: docType === "all" ? undefined : docType,
      search: search.trim() || undefined,
    }),
    [status, docType, search],
  );

  const { data: invoices = [], isLoading } = useInvoices(filters);
  const cancelMut = useCancelInvoice();
  const { data: fiscal } = useFiscalSettings();
  const { data: business } = useBusinessSettings();
  const { toast } = useToast();

  const handlePrint = async (inv: ElectronicInvoice) => {
    try {
      await printFiscalReceipt({
        invoice: inv,
        issuerTaxId: fiscal?.tax_id || business?.tax_id || null,
        settings: business ?? null,
      });
    } catch (e) {
      toast({
        title: "Error al imprimir",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const allDocTypes = Object.keys(
    DOCUMENT_TYPE_LABELS,
  ) as FiscalDocumentType[];

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    await cancelMut.mutateAsync({
      id: cancelTarget.id,
      reason: cancelReason.trim(),
      force: cancelTarget.country === "AR" ? cancelForce : undefined,
    });
    setCancelTarget(null);
    setCancelReason("");
    setCancelForce(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Comprobantes Electrónicos
        </h1>
        <p className="text-muted-foreground">
          Gestión de boletas, facturas y notas emitidas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="N° o cliente..."
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as InvoiceStatus | "all")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={docType}
              onValueChange={(v) =>
                setDocType(v as FiscalDocumentType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {allDocTypes.map((dt) => (
                  <SelectItem key={dt} value={dt}>
                    {DOCUMENT_TYPE_LABELS[dt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comprobantes ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No hay comprobantes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Doc.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const st = STATUS_LABELS[inv.status];
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">
                          {inv.full_number}
                        </TableCell>
                        <TableCell className="text-xs">
                          {DOCUMENT_TYPE_LABELS[inv.document_type]}
                        </TableCell>
                        <TableCell>
                          {inv.customer_legal_name || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {inv.customer_doc_number || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(inv.issue_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.total, company?.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                          {inv.error_message && (
                            <p
                              className="text-[10px] text-destructive mt-1 max-w-[200px] truncate"
                              title={inv.error_message}
                            >
                              {inv.error_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Imprimir comprobante con QR"
                              onClick={() => handlePrint(inv)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {inv.pdf_url && (
                              <Button
                                size="icon"
                                variant="ghost"
                                asChild
                                title="Descargar PDF"
                              >
                                <a
                                  href={inv.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {inv.status === "accepted" &&
                              !inv.document_type.includes("nota") && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Emitir Nota de Crédito"
                                    onClick={() =>
                                      setNoteTarget({ invoice: inv, kind: "credit" })
                                    }
                                  >
                                    <FileMinus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Emitir Nota de Débito"
                                    onClick={() =>
                                      setNoteTarget({ invoice: inv, kind: "debit" })
                                    }
                                  >
                                    <FilePlus className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            {(inv.status === "accepted" || inv.status === "pending") && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Anular"
                                onClick={() =>
                                  setCancelTarget({
                                    id: inv.id,
                                    full: inv.full_number || inv.id,
                                    country: inv.country as "PE" | "AR",
                                  })
                                }
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anular comprobante {cancelTarget?.full}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.country === "PE"
                ? "Se enviará la comunicación de baja a SUNAT vía Nubefact. Si no hay credenciales configuradas, la solicitud queda registrada como pendiente."
                : "AFIP no permite anular un comprobante autorizado: la anulación se realiza emitiendo una Nota de Crédito por el total. Esta acción registra la intención de anulación."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo de la anulación"
              />
            </div>
            {cancelTarget?.country === "AR" && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={cancelForce}
                  onChange={(e) => setCancelForce(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Marcar como anulado localmente de inmediato (recuerda emitir la Nota de Crédito por el total ante AFIP).
                </span>
              </label>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancelMut.isPending}
            >
              Confirmar anulación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IssueNoteDialog
        invoice={noteTarget?.invoice ?? null}
        noteKind={noteTarget?.kind ?? "credit"}
        open={!!noteTarget}
        onOpenChange={(o) => !o && setNoteTarget(null)}
      />
    </div>
  );
}
