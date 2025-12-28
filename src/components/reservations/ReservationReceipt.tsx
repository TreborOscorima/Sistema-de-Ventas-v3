import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Reservation } from "@/lib/reservations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer } from "lucide-react";

interface ReservationReceiptProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export function ReservationReceipt({
  open,
  onClose,
  reservation
}: ReservationReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!reservation) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Constancia de Reserva</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 350px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #ccc;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .receipt-number {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              font-size: 12px;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 5px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .label {
              color: #666;
            }
            .value {
              font-weight: 500;
            }
            .total-section {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            .total {
              font-size: 20px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed #ccc;
              font-size: 12px;
              color: #666;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-confirmed { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef9c3; color: #854d0e; }
            .status-completed { background: #e0e7ff; color: #3730a3; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pendiente', class: 'status-pending' },
    confirmed: { label: 'Confirmada', class: 'status-confirmed' },
    completed: { label: 'Completada', class: 'status-completed' },
    cancelled: { label: 'Cancelada', class: 'status-cancelled' },
  };

  const statusInfo = statusLabels[reservation.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Constancia de Reserva</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="bg-background p-4">
          <div className="header">
            <div className="logo">🏟️ Canchas Deportivas</div>
            <div className="receipt-number">
              Reserva #{reservation.id.slice(0, 8).toUpperCase()}
            </div>
          </div>

          <div className="section">
            <div className="section-title">Datos de la Reserva</div>
            <div className="row">
              <span className="label">Fecha:</span>
              <span className="value">
                {format(new Date(reservation.reservation_date), "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            <div className="row">
              <span className="label">Horario:</span>
              <span className="value">
                {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
              </span>
            </div>
            <div className="row">
              <span className="label">Cancha:</span>
              <span className="value">{reservation.court?.name}</span>
            </div>
            <div className="row">
              <span className="label">Deporte:</span>
              <span className="value">{reservation.court?.sport_type}</span>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Cliente</div>
            <div className="row">
              <span className="label">Nombre:</span>
              <span className="value">{reservation.customer_name}</span>
            </div>
            {reservation.customer_phone && (
              <div className="row">
                <span className="label">Teléfono:</span>
                <span className="value">{reservation.customer_phone}</span>
              </div>
            )}
            {reservation.customer_email && (
              <div className="row">
                <span className="label">Email:</span>
                <span className="value">{reservation.customer_email}</span>
              </div>
            )}
          </div>

          <div className="section">
            <div className="row">
              <span className="label">Estado:</span>
              <span className={`status ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="total-section">
            <div className="row">
              <span className="label">Total:</span>
              <span className="total">${reservation.total_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="footer">
            <p>Gracias por su reserva</p>
            <p>Emitido: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
