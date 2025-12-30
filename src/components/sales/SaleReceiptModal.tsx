import { useState, useEffect, useRef } from 'react';
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
};

export function SaleReceiptModal({
  open,
  onOpenChange,
  sale,
  items,
  loading = false,
}: SaleReceiptModalProps) {
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
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .receipt-header h1 {
              font-size: 18px;
              margin: 0;
            }
            .receipt-header p {
              font-size: 12px;
              color: #666;
              margin: 4px 0;
            }
            .receipt-items {
              width: 100%;
              border-collapse: collapse;
            }
            .receipt-items th,
            .receipt-items td {
              padding: 4px 0;
              font-size: 12px;
            }
            .receipt-items th {
              text-align: left;
              border-bottom: 1px dashed #000;
            }
            .receipt-items td.qty {
              text-align: center;
            }
            .receipt-items td.price {
              text-align: right;
            }
            .receipt-totals {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .receipt-totals .row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 4px 0;
            }
            .receipt-totals .total {
              font-size: 16px;
              font-weight: bold;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 10px 0;
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

  if (!sale) return null;

  const saleDate = new Date(sale.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Ticket de Venta
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
          <div className="my-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket:</span>
              <span className="font-medium">{sale.id.slice(0, 8).toUpperCase()}</span>
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

          <Separator className="separator" />

          {/* Items */}
          {loading ? (
            <div className="py-4 text-center text-muted-foreground">
              Cargando items...
            </div>
          ) : (
            <table className="receipt-items w-full text-sm">
              <thead>
                <tr className="border-b border-dashed border-border">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-center py-2">Cant</th>
                  <th className="text-right py-2">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1">{item.product_name}</td>
                    <td className="qty text-center">{item.quantity}</td>
                    <td className="price text-right">S/ {item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Separator className="separator" />

          {/* Totals */}
          <div className="receipt-totals space-y-1 text-sm">
            <div className="row flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>S/ {sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="row flex justify-between">
              <span className="text-muted-foreground">IGV (18%):</span>
              <span>S/ {sale.tax.toFixed(2)}</span>
            </div>
            <div className="row total flex justify-between text-lg font-bold mt-2">
              <span>TOTAL:</span>
              <span>S/ {sale.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="separator" />

          {/* Footer */}
          <div className="receipt-footer text-center text-xs text-muted-foreground mt-4">
            <p>¡Gracias por su compra!</p>
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
