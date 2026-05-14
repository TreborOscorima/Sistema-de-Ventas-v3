import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { useFiscalSettings } from "@/hooks/use-fiscal-settings";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import {
  buildAfipFilename,
  buildSunatFilename,
  downloadTextFile,
  generateAfipCsv,
  generateSunatLedgerTxt,
  summarize,
} from "@/lib/fiscal-reports";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  type FiscalCountry,
} from "@/lib/fiscal";
import { formatCurrency } from "@/lib/currency";

function defaultPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodRange(period: string): { from: string; to: string } {
  const [y, m] = period.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export default function ReportesFiscalesPage() {
  const { company } = useCompany();
  const { data: fiscal } = useFiscalSettings();
  const { toast } = useToast();
  const [period, setPeriod] = useState<string>(defaultPeriod());
  const [country, setCountry] = useState<FiscalCountry>(
    (fiscal?.country as FiscalCountry) || "PE",
  );

  const range = useMemo(() => periodRange(period), [period]);

  const { data: invoices = [], isLoading } = useInvoices({
    from: range.from,
    to: range.to,
  });

  const filtered = useMemo(
    () => invoices.filter((i) => i.country === country),
    [invoices, country],
  );

  const summary = useMemo(() => summarize(filtered), [filtered]);

  const handleExportSunat = () => {
    const ruc = fiscal?.tax_id || "00000000000";
    if (!filtered.length) {
      toast({ title: "Sin comprobantes", description: "No hay registros en el periodo." });
      return;
    }
    const txt = generateSunatLedgerTxt(filtered, { period, ruc });
    downloadTextFile(txt, buildSunatFilename(ruc, period), "text/plain;charset=utf-8");
    toast({ title: "Libro de Ventas generado", description: `Periodo ${period}` });
  };

  const handleExportAfip = () => {
    if (!filtered.length) {
      toast({ title: "Sin comprobantes", description: "No hay registros en el periodo." });
      return;
    }
    const csv = generateAfipCsv(filtered);
    downloadTextFile(
      csv,
      buildAfipFilename(period, fiscal?.tax_id || undefined),
      "text/csv;charset=utf-8",
    );
    toast({ title: "Mis Comprobantes generado", description: `Periodo ${period}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes Fiscales</h1>
        <p className="text-muted-foreground">
          Exporta el Libro de Ventas SUNAT (PE) o "Mis Comprobantes" AFIP (AR).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Periodo</Label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Select value={country} onValueChange={(v) => setCountry(v as FiscalCountry)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PE">Perú (SUNAT)</SelectItem>
                <SelectItem value="AR">Argentina (AFIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            {country === "PE" ? (
              <Button onClick={handleExportSunat} className="w-full" disabled={!filtered.length}>
                <FileText className="mr-2 h-4 w-4" />
                Libro de Ventas (TXT)
              </Button>
            ) : (
              <Button onClick={handleExportAfip} className="w-full" disabled={!filtered.length}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Mis Comprobantes (CSV)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Comprobantes" value={summary.count.toString()} />
        <SummaryCard
          label="Subtotal"
          value={formatCurrency(summary.subtotal, company?.currency)}
        />
        <SummaryCard
          label={country === "PE" ? "IGV" : "IVA"}
          value={formatCurrency(summary.tax, company?.currency)}
        />
        <SummaryCard
          label="Total emitido"
          value={formatCurrency(summary.total, company?.currency)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatusCard label="Aceptados" value={summary.accepted} variant="default" />
        <StatusCard label="Pendientes" value={summary.pending} variant="secondary" />
        <StatusCard label="Rechazados" value={summary.rejected} variant="destructive" />
        <StatusCard label="Anulados" value={summary.cancelled} variant="outline" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay comprobantes en el periodo seleccionado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Imp.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const status = STATUS_LABELS[inv.status];
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.issue_date}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {inv.full_number || `${inv.series}-${inv.number}`}
                        </TableCell>
                        <TableCell className="text-xs">
                          {DOCUMENT_TYPE_LABELS[inv.document_type]}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {inv.customer_legal_name || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.subtotal, inv.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.tax_amount, inv.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(inv.total, inv.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
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
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <span className="text-sm">{label}</span>
        <Badge variant={variant}>{value}</Badge>
      </CardContent>
    </Card>
  );
}
