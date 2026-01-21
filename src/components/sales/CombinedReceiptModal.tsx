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
import { useBusinessSettings } from '@/hooks/use-settings';
import { 
  printThermalReceipt, 
  generateReceiptHeader, 
  generateReceiptFooter,
  formatCurrency 
} from '@/lib/thermal-print';

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
  const { data: settings } = useBusinessSettings();

  const handlePrint = () => {
    if (!saleData) return;
    
    const dateStr = format(saleData.createdAt, "dd/MM/yyyy HH:mm", { locale: es });
    const nowStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
    
    const hasProducts = saleData.products.length > 0;
    const hasReservations = saleData.reservations.length > 0;
    const isCombined = hasProducts && hasReservations;

    // Generate reservations HTML
    const reservationsHtml = saleData.reservations.map(reservation => `
      <div class="reservation-item">
        <div class="court-name">${reservation.courtName}</div>
        <div class="customer-name">${reservation.customerName}</div>
        <div class="datetime">
          ${format(new Date(reservation.date), "EEE d 'de' MMM", { locale: es })} • ${reservation.startTime.slice(0, 5)} - ${reservation.endTime.slice(0, 5)}
        </div>
        <div class="price-row">
          <span></span>
          <span>${formatCurrency(reservation.price)}</span>
        </div>
      </div>
    `).join('');

    // Generate products HTML
    const productsHtml = saleData.products.map(item => `
      <tr>
        <td class="item-name">${item.name}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      ${generateReceiptHeader(settings || null)}
      
      <hr class="separator" />
      
      <div class="info-row">
        <span class="label">Ticket:</span>
        <span class="value">#${saleData.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Fecha:</span>
        <span class="value">${dateStr}</span>
      </div>
      ${saleData.customerName ? `
        <div class="info-row">
          <span class="label">Cliente:</span>
          <span class="value">${saleData.customerName}</span>
        </div>
      ` : ''}
      <div class="info-row">
        <span class="label">Método:</span>
        <span class="value">
          ${paymentMethodLabels[saleData.paymentMethod] || saleData.paymentMethod}
          ${saleData.isCredit ? ' <span class="status-badge status-credit">CRÉDITO</span>' : ''}
        </span>
      </div>
      
      <hr class="separator" />
      
      ${hasReservations ? `
        <div class="section-title">📅 RESERVAS</div>
        ${reservationsHtml}
        ${isCombined ? `
          <div class="total-row subtotal" style="margin-top: 8px; padding-top: 4px; border-top: 1px dotted #ccc;">
            <span>Subtotal Reservas:</span>
            <span>${formatCurrency(saleData.reservationsTotal)}</span>
          </div>
        ` : ''}
      ` : ''}
      
      ${hasProducts ? `
        ${isCombined ? '<hr class="separator" />' : ''}
        <div class="section-title">🛒 PRODUCTOS</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="center">Cant</th>
              <th class="right">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
        </table>
        
        <div class="totals-section" style="border-top: 1px dotted #ccc; padding-top: 4px; margin-top: 4px;">
          <div class="total-row subtotal">
            <span>Subtotal:</span>
            <span>${formatCurrency(saleData.productSubtotal)}</span>
          </div>
          <div class="total-row subtotal">
            <span>${settings?.tax_name || 'IGV'} (${settings?.tax_rate || 18}%):</span>
            <span>${formatCurrency(saleData.productTax)}</span>
          </div>
          ${isCombined ? `
            <div class="total-row subtotal">
              <span>Subtotal Productos:</span>
              <span>${formatCurrency(saleData.productTotal)}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <hr class="separator-double" />
      
      <div class="totals-section">
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(saleData.grandTotal)}</span>
        </div>
      </div>
      
      ${generateReceiptFooter(settings || null, nowStr)}
    `;

    const title = isCombined ? 'Venta Combinada' : hasReservations ? 'Reservas' : 'Venta';
    printThermalReceipt(htmlContent, `${title} #${saleData.id.slice(0, 8).toUpperCase()}`);
  };

  if (!saleData) return null;

  const hasProducts = saleData.products.length > 0;
  const hasReservations = saleData.reservations.length > 0;
  const isCombined = hasProducts && hasReservations;

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isCombined ? 'Ticket - Venta Combinada' : hasReservations ? 'Ticket - Reservas' : 'Ticket de Venta'}
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

          {/* Sale Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket:</span>
              <span className="font-medium">#{saleData.id.slice(0, 8).toUpperCase()}</span>
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
              <span className="flex items-center gap-1">
                {paymentMethodLabels[saleData.paymentMethod] || saleData.paymentMethod}
                {saleData.isCredit && (
                  <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                    CRÉDITO
                  </span>
                )}
              </span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Reservations Section */}
          {hasReservations && (
            <>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="h-3 w-3" />
                <span>Reservas</span>
              </div>
              
              <div className="space-y-2">
                {saleData.reservations.map((reservation) => (
                  <div key={reservation.id} className="py-1 border-b border-dotted border-border last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-xs">{reservation.courtName}</p>
                        <p className="text-[10px] text-muted-foreground">{reservation.customerName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(reservation.date), "EEE d 'de' MMM", { locale: es })} • {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </p>
                      </div>
                      <span className="font-semibold text-xs">{formatCurrency(reservation.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {isCombined && (
                <div className="flex justify-between text-xs mt-2 pt-1 border-t border-dotted border-border">
                  <span className="text-muted-foreground">Subtotal Reservas:</span>
                  <span>{formatCurrency(saleData.reservationsTotal)}</span>
                </div>
              )}
            </>
          )}

          {/* Products Section */}
          {hasProducts && (
            <>
              {isCombined && <Separator className="my-2" />}
              
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider mb-2">
                <ShoppingBag className="h-3 w-3" />
                <span>Productos</span>
              </div>
              
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dashed border-border">
                    <th className="text-left py-1 text-[10px]">Producto</th>
                    <th className="text-center py-1 text-[10px] w-10">Cant</th>
                    <th className="text-right py-1 text-[10px] w-14">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.products.map((item, index) => (
                    <tr key={index}>
                      <td className="py-1 text-[11px] truncate max-w-[100px]">{item.name}</td>
                      <td className="text-center text-[11px]">{item.quantity}</td>
                      <td className="text-right text-[11px]">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 pt-1 border-t border-dotted border-border space-y-0.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(saleData.productSubtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{settings?.tax_name || 'IGV'} ({settings?.tax_rate || 18}%):</span>
                  <span>{formatCurrency(saleData.productTax)}</span>
                </div>
                {isCombined && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Productos:</span>
                    <span>{formatCurrency(saleData.productTotal)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="border-t-2 border-border mt-3 pt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(saleData.grandTotal)}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p className="font-medium">{settings?.receipt_footer || '¡Gracias por su preferencia!'}</p>
            <p className="mt-1">Conserve este ticket</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
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
