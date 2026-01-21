import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Reservation } from "@/lib/reservations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer, X, FileText } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-settings";
import { 
  printThermalReceipt, 
  generateReceiptHeader, 
  generateReceiptFooter,
  formatCurrency 
} from "@/lib/thermal-print";

interface ReservationReceiptProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  pending: { label: 'PENDIENTE', class: 'status-pending' },
  confirmed: { label: 'CONFIRMADA', class: 'status-confirmed' },
  completed: { label: 'COMPLETADA', class: 'status-completed' },
  cancelled: { label: 'CANCELADA', class: 'status-cancelled' },
};

export function ReservationReceipt({
  open,
  onClose,
  reservation
}: ReservationReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useBusinessSettings();

  if (!reservation) return null;

  const handlePrint = () => {
    const reservationDate = new Date(reservation.reservation_date);
    const dateStr = format(reservationDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
    const nowStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
    const statusInfo = statusLabels[reservation.status];

    const htmlContent = `
      ${generateReceiptHeader(settings || null)}
      
      <hr class="separator" />
      
      <div class="section-title">📋 CONSTANCIA DE RESERVA</div>
      
      <hr class="separator" />
      
      <div class="info-row">
        <span class="label">N° Reserva:</span>
        <span class="value">#${reservation.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Estado:</span>
        <span class="value"><span class="status-badge ${statusInfo.class}">${statusInfo.label}</span></span>
      </div>
      
      <hr class="separator" />
      
      <div class="section-title">📅 DATOS DE LA RESERVA</div>
      
      <div class="info-row">
        <span class="label">Fecha:</span>
        <span class="value">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="label">Horario:</span>
        <span class="value">${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)}</span>
      </div>
      <div class="info-row">
        <span class="label">Cancha:</span>
        <span class="value">${reservation.court?.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Deporte:</span>
        <span class="value">${reservation.court?.sport_type || 'N/A'}</span>
      </div>
      
      <hr class="separator" />
      
      <div class="section-title">👤 CLIENTE</div>
      
      <div class="info-row">
        <span class="label">Nombre:</span>
        <span class="value">${reservation.customer_name}</span>
      </div>
      ${reservation.customer_phone ? `
        <div class="info-row">
          <span class="label">Teléfono:</span>
          <span class="value">${reservation.customer_phone}</span>
        </div>
      ` : ''}
      ${reservation.customer_email ? `
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${reservation.customer_email}</span>
        </div>
      ` : ''}
      
      ${reservation.notes ? `
        <hr class="separator" />
        <div class="info-row">
          <span class="label">Notas:</span>
        </div>
        <div style="font-size: 10px; font-style: italic; padding: 4px 0;">${reservation.notes}</div>
      ` : ''}
      
      <hr class="separator-double" />
      
      <div class="totals-section">
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(reservation.total_amount)}</span>
        </div>
      </div>
      
      ${generateReceiptFooter(settings || null, nowStr)}
    `;

    printThermalReceipt(htmlContent, `Reserva #${reservation.id.slice(0, 8).toUpperCase()}`);
  };

  const statusInfo = statusLabels[reservation.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Constancia de Reserva
          </DialogTitle>
        </DialogHeader>
        
        <div ref={receiptRef} className="bg-background p-4 rounded-lg border border-border font-mono text-sm">
          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-base font-bold">{settings?.business_name || 'MI NEGOCIO'}</h1>
            {settings?.tax_id && <p className="text-xs text-muted-foreground">RUC: {settings.tax_id}</p>}
            {settings?.address && <p className="text-xs text-muted-foreground">{settings.address}</p>}
            {settings?.phone && <p className="text-xs text-muted-foreground">Tel: {settings.phone}</p>}
          </div>

          <Separator className="my-2" />

          <div className="text-center text-xs font-bold uppercase tracking-wider mb-2">
            📋 Constancia de Reserva
          </div>

          <Separator className="my-2" />

          {/* Reservation Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">N° Reserva:</span>
              <span className="font-medium">#{reservation.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estado:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="text-xs font-bold uppercase tracking-wider mb-1">📅 Datos de la Reserva</div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{format(new Date(reservation.reservation_date), "dd 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horario:</span>
              <span>{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancha:</span>
              <span>{reservation.court?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deporte:</span>
              <span>{reservation.court?.sport_type}</span>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="text-xs font-bold uppercase tracking-wider mb-1">👤 Cliente</div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre:</span>
              <span>{reservation.customer_name}</span>
            </div>
            {reservation.customer_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono:</span>
                <span>{reservation.customer_phone}</span>
              </div>
            )}
            {reservation.customer_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="truncate max-w-[120px]">{reservation.customer_email}</span>
              </div>
            )}
          </div>

          {reservation.notes && (
            <>
              <Separator className="my-2" />
              <div className="text-xs">
                <span className="text-muted-foreground">Notas:</span>
                <p className="italic mt-1">{reservation.notes}</p>
              </div>
            </>
          )}

          <div className="border-t-2 border-border mt-3 pt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(reservation.total_amount)}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p className="font-medium">{settings?.receipt_footer || 'Gracias por su reserva'}</p>
            <p className="mt-1">Emitido: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button size="sm" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
