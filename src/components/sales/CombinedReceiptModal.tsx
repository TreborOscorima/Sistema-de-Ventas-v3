import { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, X, Receipt, Calendar, ShoppingBag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/lib/sales';
import { ReservationCartItem } from '@/hooks/use-pos';

interface CombinedReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleData: {
    id: string;
    createdAt: Date;
    customerName?: string;
    paymentMethod: string;
    products: CartItem[];
    reservations: ReservationCartItem[];
    productSubtotal: number;
    productTax: number;
    productTotal: number;
    reservationsTotal: number;
    grandTotal: number;
    isCredit: boolean;
  } | null;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
  credit: 'Crédito',
};

export function CombinedReceiptModal({
  open,
  onOpenChange,
  saleData,
}: CombinedReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 15px;
            }
            .receipt-header h1 {
              font-size: 16px;
              margin: 0;
            }
            .receipt-header p {
              font-size: 11px;
              color: #666;
              margin: 2px 0;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .section-title {
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              margin: 8px 0 4px 0;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .section-title svg {
              width: 12px;
              height: 12px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 11px;
            }
            .item-row .name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .item-row .qty {
              margin: 0 8px;
              min-width: 30px;
              text-align: center;
            }
            .item-row .price {
              min-width: 60px;
              text-align: right;
            }
            .reservation-item {
              margin: 6px 0;
              padding: 4px 0;
            }
            .reservation-item .name {
              font-weight: bold;
              font-size: 11px;
            }
            .reservation-item .details {
              font-size: 10px;
              color: #666;
            }
            .reservation-item .price-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .totals {
              margin-top: 10px;
            }
            .totals .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .totals .row.subtotal {
              font-size: 11px;
              color: #666;
            }
            .totals .row.grand-total {
              font-size: 14px;
              font-weight: bold;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px dashed #000;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              color: #666;
            }
            .credit-badge {
              background: #f59e0b;
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!saleData) return null;

  const hasProducts = saleData.products.length > 0;
  const hasReservations = saleData.reservations.length > 0;
  const isCombined = hasProducts && hasReservations;

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isCombined ? 'Ticket - Venta Combinada' : hasReservations ? 'Ticket - Reservas' : 'Ticket de Venta'}
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="bg-background p-4 rounded-lg border border-border">
          {/* Header */}
          <div className="receipt-header text-center mb-4">
            <h1 className="text-lg font-bold">MI NEGOCIO</h1>
            <p className="text-sm text-muted-foreground">RUC: 20123456789</p>
            <p className="text-sm text-muted-foreground">Av. Principal 123</p>
            <p className="text-sm text-muted-foreground">Tel: (01) 234-5678</p>
          </div>

          <Separator className="separator" />

          {/* Sale Info */}
          <div className="my-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket:</span>
              <span className="font-medium">{saleData.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{format(saleData.createdAt, "dd/MM/yyyy HH:mm", { locale: es })}</span>
            </div>
            {saleData.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{saleData.customerName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Método:</span>
              <span className="flex items-center gap-2">
                {paymentMethodLabels[saleData.paymentMethod] || saleData.paymentMethod}
                {saleData.isCredit && (
                  <span className="credit-badge bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    CRÉDITO
                  </span>
                )}
              </span>
            </div>
          </div>

          <Separator className="separator" />

          {/* Reservations Section */}
          {hasReservations && (
            <>
              <div className="section-title flex items-center gap-2 font-bold text-xs uppercase mt-3 mb-2">
                <Calendar className="h-3 w-3" />
                <span>Reservas</span>
              </div>
              
              <div className="space-y-2">
                {saleData.reservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-item py-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reservation.courtName}</p>
                        <p className="text-xs text-muted-foreground">{reservation.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reservation.date), "EEE d 'de' MMM", { locale: es })} • {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">S/ {reservation.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {isCombined && (
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-dashed border-border">
                  <span className="text-muted-foreground">Subtotal Reservas:</span>
                  <span>S/ {saleData.reservationsTotal.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {/* Products Section */}
          {hasProducts && (
            <>
              {isCombined && <Separator className="separator my-3" />}
              
              <div className="section-title flex items-center gap-2 font-bold text-xs uppercase mt-3 mb-2">
                <ShoppingBag className="h-3 w-3" />
                <span>Productos</span>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashed border-border">
                    <th className="text-left py-1 text-xs">Producto</th>
                    <th className="text-center py-1 text-xs">Cant</th>
                    <th className="text-right py-1 text-xs">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.products.map((item, index) => (
                    <tr key={index}>
                      <td className="py-1 text-xs">{item.name}</td>
                      <td className="text-center text-xs">{item.quantity}</td>
                      <td className="text-right text-xs">S/ {(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 pt-2 border-t border-dashed border-border space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>S/ {saleData.productSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IGV (18%):</span>
                  <span>S/ {saleData.productTax.toFixed(2)}</span>
                </div>
                {isCombined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal Productos:</span>
                    <span>S/ {saleData.productTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator className="separator my-3" />

          {/* Grand Total */}
          <div className="totals">
            <div className="row grand-total flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>S/ {saleData.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="separator my-3" />

          {/* Footer */}
          <div className="footer text-center text-xs text-muted-foreground">
            <p>¡Gracias por su preferencia!</p>
            <p>Conserve este ticket</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
