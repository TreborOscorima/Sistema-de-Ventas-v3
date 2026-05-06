import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmitInvoice } from "@/hooks/use-invoices";
import { getDocumentSeries, type ElectronicInvoice, type FiscalDocumentType } from "@/lib/fiscal";
import { formatCurrency } from "@/lib/currency";

interface Props {
  invoice: ElectronicInvoice | null;
  noteKind: "credit" | "debit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemRow {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  unit_code?: string;
  selected: boolean;
  max_quantity: number;
}

// Mapea factura -> tipo de nota correspondiente
function noteDocType(
  ref: ElectronicInvoice,
  kind: "credit" | "debit",
): FiscalDocumentType {
  if (ref.country === "PE") {
    return kind === "credit" ? "pe_nota_credito" : "pe_nota_debito";
  }
  // AR: misma letra que la factura
  const letter = ref.document_type.split("_").pop();
  return (
    kind === "credit"
      ? `ar_nota_credito_${letter}`
      : `ar_nota_debito_${letter}`
  ) as FiscalDocumentType;
}

// Razones SUNAT para NC (catálogo 09) / ND (catálogo 10)
const PE_NC_REASONS: Record<number, string> = {
  1: "Anulación de la operación",
  2: "Anulación por error en RUC",
  3: "Corrección por error en la descripción",
  4: "Descuento global",
  5: "Descuento por ítem",
  6: "Devolución total",
  7: "Devolución por ítem",
  8: "Bonificación",
  9: "Disminución en el valor",
};
const PE_ND_REASONS: Record<number, string> = {
  1: "Intereses por mora",
  2: "Aumento en el valor",
  3: "Penalidades / otros conceptos",
};

export function IssueNoteDialog({ invoice, noteKind, open, onOpenChange }: Props) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [reason, setReason] = useState("");
  const [noteCode, setNoteCode] = useState<number>(1);
  const [series, setSeries] = useState<string>("");
  const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const emit = useEmitInvoice();

  const docType = useMemo(
    () => (invoice ? noteDocType(invoice, noteKind) : null),
    [invoice, noteKind],
  );

  useEffect(() => {
    if (!open || !invoice) return;
    setReason("");
    setNoteCode(noteKind === "credit" ? 1 : 1);
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id);
      setItems(
        (data || []).map((it: any) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          tax_rate: Number(it.tax_rate),
          unit_code: it.unit_code,
          selected: true,
          max_quantity: Number(it.quantity),
        })),
      );
      if (docType) {
        const series = await getDocumentSeries(invoice.company_id);
        const opts = series
          .filter((s) => s.document_type === docType && s.is_active)
          .map((s) => s.series);
        setSeriesOptions(opts);
        setSeries(opts[0] || "");
      }
      setLoading(false);
    })();
  }, [open, invoice, docType, noteKind]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    items
      .filter((i) => i.selected && i.quantity > 0)
      .forEach((i) => {
        const lineTotal = i.quantity * i.unit_price;
        const net = lineTotal / (1 + i.tax_rate / 100);
        subtotal += net;
        tax += lineTotal - net;
      });
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  const handleSubmit = async () => {
    if (!invoice || !docType) return;
    const selectedItems = items.filter((i) => i.selected && i.quantity > 0);
    if (selectedItems.length === 0) return;
    if (!reason.trim()) return;
    if (!series) return;

    await emit.mutateAsync({
      company_id: invoice.company_id,
      branch_id: invoice.branch_id,
      document_type: docType,
      series,
      customer: {
        id: invoice.customer_id,
        doc_type: (invoice.customer_doc_type || "pe_sin_doc") as any,
        doc_number: invoice.customer_doc_number || "",
        legal_name: invoice.customer_legal_name || "",
        address: invoice.customer_address || undefined,
        email: invoice.customer_email || undefined,
      },
      currency: invoice.currency,
      items: selectedItems.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        tax_rate: i.tax_rate,
        unit_code: i.unit_code,
      })),
      observations: reason,
      reference_invoice_id: invoice.id,
      note_type_code: invoice.country === "PE" ? noteCode : undefined,
      note_reason: reason,
    });
    onOpenChange(false);
  };

  const reasonsMap = noteKind === "credit" ? PE_NC_REASONS : PE_ND_REASONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Emitir Nota de {noteKind === "credit" ? "Crédito" : "Débito"}
          </DialogTitle>
          <DialogDescription>
            Referencia: {invoice?.full_number}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Serie</Label>
                <Select value={series} onValueChange={setSeries}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona serie" />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {seriesOptions.length === 0 && (
                  <p className="text-xs text-destructive">
                    No hay series activas para este tipo. Crea una en
                    Configuración → Series.
                  </p>
                )}
              </div>
              {invoice?.country === "PE" && (
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={String(noteCode)}
                    onValueChange={(v) => setNoteCode(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reasonsMap).map(([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descripción del motivo de la nota"
              />
            </div>

            <div className="space-y-2">
              <Label>Ítems afectados</Label>
              <div className="border rounded-md divide-y">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 text-sm"
                  >
                    <Checkbox
                      checked={it.selected}
                      onCheckedChange={(v) =>
                        setItems((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, selected: !!v } : p,
                          ),
                        )
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        P.U. {formatCurrency(it.unit_price, invoice?.currency)} ·
                        IGV/IVA {it.tax_rate}%
                      </p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        max={it.max_quantity}
                        value={it.quantity}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((p, i) =>
                              i === idx
                                ? {
                                    ...p,
                                    quantity: Math.min(
                                      Number(e.target.value) || 0,
                                      p.max_quantity,
                                    ),
                                  }
                                : p,
                            ),
                          )
                        }
                        disabled={!it.selected}
                      />
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Sin ítems en el comprobante de referencia
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal, invoice?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuesto</span>
                <span>{formatCurrency(totals.tax, invoice?.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
                <span>{formatCurrency(totals.total, invoice?.currency)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              emit.isPending ||
              !reason.trim() ||
              !series ||
              totals.total <= 0
            }
          >
            {emit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Emitir nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
