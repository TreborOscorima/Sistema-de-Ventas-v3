import { BusinessSettings } from './settings';

// Thermal printer configuration for 80mm printers (most common)
// Character width: ~42-48 characters per line depending on font size
const CHARS_PER_LINE = 42;

export interface PrintStyles {
  width: string;
  fontSize: string;
  fontFamily: string;
}

export const THERMAL_STYLES: PrintStyles = {
  width: '80mm',
  fontSize: '12px',
  fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
};

// Helper functions for formatting text for thermal printers
export function centerText(text: string, width: number = CHARS_PER_LINE): string {
  const trimmed = text.slice(0, width);
  const padding = Math.max(0, Math.floor((width - trimmed.length) / 2));
  return ' '.repeat(padding) + trimmed;
}

export function leftRightText(left: string, right: string, width: number = CHARS_PER_LINE): string {
  const maxLeftWidth = width - right.length - 1;
  const leftTrimmed = left.slice(0, maxLeftWidth);
  const spaces = Math.max(1, width - leftTrimmed.length - right.length);
  return leftTrimmed + ' '.repeat(spaces) + right;
}

export function repeatChar(char: string, count: number = CHARS_PER_LINE): string {
  return char.repeat(count);
}

export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

// Generate CSS for thermal printing
export function getThermalPrintStyles(): string {
  return `
    @page {
      margin: 0;
      size: 80mm auto;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${THERMAL_STYLES.fontFamily};
      font-size: ${THERMAL_STYLES.fontSize};
      width: ${THERMAL_STYLES.width};
      max-width: ${THERMAL_STYLES.width};
      margin: 0 auto;
      padding: 8px;
      background: white;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .thermal-receipt {
      width: 100%;
    }
    
    .receipt-header {
      text-align: center;
      margin-bottom: 8px;
    }
    
    .receipt-header .business-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .receipt-header .business-info {
      font-size: 10px;
      color: #333;
      line-height: 1.4;
    }
    
    .receipt-header .logo {
      max-width: 120px;
      max-height: 60px;
      margin-bottom: 4px;
    }
    
    .separator {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    
    .separator-double {
      border: none;
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      line-height: 1.5;
    }
    
    .info-row .label {
      color: #333;
    }
    
    .info-row .value {
      font-weight: 500;
      text-align: right;
    }
    
    .section-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 8px 0 4px 0;
      text-align: center;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    .items-table th {
      text-align: left;
      font-size: 10px;
      font-weight: bold;
      padding: 4px 0;
      border-bottom: 1px solid #000;
    }
    
    .items-table th.center { text-align: center; }
    .items-table th.right { text-align: right; }
    
    .items-table td {
      padding: 3px 0;
      font-size: 11px;
      vertical-align: top;
    }
    
    .items-table td.center { text-align: center; }
    .items-table td.right { text-align: right; }
    
    .items-table .item-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .reservation-item {
      padding: 4px 0;
      border-bottom: 1px dotted #ccc;
    }
    
    .reservation-item:last-child {
      border-bottom: none;
    }
    
    .reservation-item .court-name {
      font-weight: bold;
      font-size: 11px;
    }
    
    .reservation-item .customer-name {
      font-size: 10px;
      color: #333;
    }
    
    .reservation-item .datetime {
      font-size: 10px;
      color: #333;
    }
    
    .reservation-item .price-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-top: 2px;
    }
    
    .totals-section {
      margin-top: 8px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      line-height: 1.5;
    }
    
    .total-row.subtotal {
      color: #333;
    }
    
    .total-row.grand-total {
      font-size: 14px;
      font-weight: bold;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 2px solid #000;
    }
    
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border: 1px solid #000;
      border-radius: 2px;
    }
    
    .status-confirmed { background: #d1fae5; }
    .status-pending { background: #fef3c7; }
    .status-completed { background: #dbeafe; }
    .status-cancelled { background: #fee2e2; }
    .status-credit { background: #fef3c7; border-color: #f59e0b; }
    
    .receipt-footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }
    
    .receipt-footer .thanks {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .receipt-footer .message {
      font-size: 10px;
      color: #333;
      line-height: 1.4;
    }
    
    .receipt-footer .datetime {
      font-size: 9px;
      color: #666;
      margin-top: 6px;
    }
    
    .qr-placeholder {
      text-align: center;
      margin: 8px 0;
    }
    
    .cut-line {
      text-align: center;
      margin-top: 16px;
      font-size: 10px;
      color: #666;
    }
    
    .cut-line::before,
    .cut-line::after {
      content: '- - - - - - - - ';
    }
  `;
}

// Open print window with thermal-optimized content
export function printThermalReceipt(htmlContent: string, title: string = 'Ticket'): void {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${getThermalPrintStyles()}</style>
    </head>
    <body>
      <div class="thermal-receipt">
        ${htmlContent}
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Wait for content to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 100);
  };
}

// Generate header HTML from business settings
export function generateReceiptHeader(settings: BusinessSettings | null): string {
  const businessName = settings?.business_name || 'MI NEGOCIO';
  const taxId = settings?.tax_id;
  const address = settings?.address;
  const phone = settings?.phone;
  const email = settings?.email;
  const logoUrl = settings?.logo_url;
  const showLogo = settings?.show_logo_on_receipt && logoUrl;
  const customHeader = settings?.receipt_header;

  return `
    <div class="receipt-header">
      ${showLogo ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="business-name">${businessName}</div>
      <div class="business-info">
        ${taxId ? `RUC: ${taxId}<br>` : ''}
        ${address ? `${address}<br>` : ''}
        ${phone ? `Tel: ${phone}<br>` : ''}
        ${email ? `${email}<br>` : ''}
        ${customHeader ? `${customHeader}` : ''}
      </div>
    </div>
  `;
}

// Generate footer HTML from business settings  
export function generateReceiptFooter(settings: BusinessSettings | null, dateStr: string): string {
  const customFooter = settings?.receipt_footer || '¡Gracias por su preferencia!';
  
  return `
    <div class="receipt-footer">
      <div class="thanks">${customFooter}</div>
      <div class="message">Conserve este comprobante</div>
      <div class="datetime">Emitido: ${dateStr}</div>
    </div>
    <div class="cut-line">CORTAR</div>
  `;
}
