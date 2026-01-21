import { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Printer, X, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sale, SaleItem } from '@/lib/sales';
import { useBusinessSettings } from '@/hooks/use-settings';
import { 
  printThermalReceipt, 
  generateReceiptHeader, 
  generateReceiptFooter,
  formatCurrency,
  ThermalPaperSize
} from '@/lib/thermal-print';

interface SaleReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  items: SaleItem[];
  loading?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  transfer: 'Transferencia',
  credit: 'Crédito',
};

export function SaleReceiptModal({
  open,
  onOpenChange,
  sale,
  items,
  loading = false,
}: SaleReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useBusinessSettings();

  const handlePrint = () => {
    if (!sale) return;
    
    const saleDate = new Date(sale.created_at);
    const dateStr = format(saleDate, "dd/MM/yyyy HH:mm", { locale: es });
    const nowStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
    
    const itemsHtml = items.map(item => `
      <tr>
        <td class="item-name">${item.product_name}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      ${generateReceiptHeader(settings || null)}
      
      <hr class="separator" />
      
      <div class="info-row">
        <span class="label">Ticket:</span>
        <span class="value">#${sale.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="label">Fecha:</span>
        <span class="value">${dateStr}</span>
      </div>
      ${sale.customer_name ? `
        <div class="info-row">
          <span class="label">Cliente:</span>
          <span class="value">${sale.customer_name}</span>
        </div>
      ` : ''}
      <div class="info-row">
        <span class="label">Método:</span>
        <span class="value">${paymentMethodLabels[sale.payment_method] || sale.payment_method}</span>
      </div>
      
      <hr class="separator" />
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th class="center">Cant</th>
            <th class="right">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <hr class="separator" />
      
      <div class="totals-section">
        <div class="total-row subtotal">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        <div class="total-row subtotal">
          <span>${settings?.tax_name || 'IGV'} (${settings?.tax_rate || 18}%):</span>
          <span>${formatCurrency(sale.tax)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>
      </div>
      
      ${generateReceiptFooter(settings || null, nowStr)}
    `;

    const paperSize = (settings as any)?.thermal_paper_size as ThermalPaperSize || '80mm';
    printThermalReceipt(htmlContent, `Ticket #${sale.id.slice(0, 8).toUpperCase()}`, paperSize);
  };

  if (!sale) return null;

  const saleDate = new Date(sale.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Ticket de Venta
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
              <span className="font-medium">#{sale.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{format(saleDate, "dd/MM/yyyy HH:mm", { locale: es })}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método:</span>
              <span>{paymentMethodLabels[sale.payment_method] || sale.payment_method}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Items */}
          {loading ? (
            <div className="py-3 text-center text-muted-foreground text-xs">
              Cargando items...
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dashed border-border">
                  <th className="text-left py-1">Producto</th>
                  <th className="text-center py-1 w-12">Cant</th>
                  <th className="text-right py-1 w-16">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 truncate max-w-[120px]">{item.product_name}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Separator className="my-2" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{settings?.tax_name || 'IGV'} ({settings?.tax_rate || 18}%):</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p className="font-medium">{settings?.receipt_footer || '¡Gracias por su compra!'}</p>
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
