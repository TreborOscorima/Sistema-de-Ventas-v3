import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/use-settings";
import { Receipt, Image, FileText, Save, Loader2 } from "lucide-react";

export function ReceiptSettings() {
  const { data: settings, isLoading } = useBusinessSettings();
  const updateSettings = useUpdateBusinessSettings();

  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(false);

  useEffect(() => {
    if (settings) {
      setReceiptHeader(settings.receipt_header || "");
      setReceiptFooter(settings.receipt_footer || "");
      setShowLogoOnReceipt(settings.show_logo_on_receipt);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      receipt_header: receiptHeader || null,
      receipt_footer: receiptFooter || null,
      show_logo_on_receipt: showLogoOnReceipt,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Personalización de Recibos
        </CardTitle>
        <CardDescription>
          Personaliza el formato y contenido de los recibos de venta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Mostrar logo en recibo
            </Label>
            <p className="text-sm text-muted-foreground">
              Incluye el logo del negocio en la parte superior del recibo
            </p>
          </div>
          <Switch
            checked={showLogoOnReceipt}
            onCheckedChange={setShowLogoOnReceipt}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptHeader" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Encabezado del recibo
          </Label>
          <Textarea
            id="receiptHeader"
            value={receiptHeader}
            onChange={(e) => setReceiptHeader(e.target.value)}
            placeholder="Texto que aparecerá en la parte superior del recibo..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Ej: "¡Bienvenido a nuestra tienda!" o información adicional de contacto
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptFooter" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pie del recibo
          </Label>
          <Textarea
            id="receiptFooter"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="Texto que aparecerá en la parte inferior del recibo..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Ej: "¡Gracias por su compra!" o políticas de devolución
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Vista previa del recibo
          </h4>
          <div className="bg-background rounded border p-4 text-sm font-mono space-y-3">
            {showLogoOnReceipt && (
              <div className="text-center text-muted-foreground border-b pb-2">
                [LOGO]
              </div>
            )}
            <div className="text-center font-bold">
              {settings?.business_name || "MI NEGOCIO"}
            </div>
            {settings?.address && (
              <div className="text-center text-xs text-muted-foreground">
                {settings.address}
              </div>
            )}
            {receiptHeader && (
              <div className="text-center text-xs border-t pt-2 whitespace-pre-wrap">
                {receiptHeader}
              </div>
            )}
            <div className="border-t border-b py-2 my-2 space-y-1">
              <div className="flex justify-between">
                <span>Producto 1</span>
                <span>$50.00</span>
              </div>
              <div className="flex justify-between">
                <span>Producto 2</span>
                <span>$25.00</span>
              </div>
            </div>
            <div className="flex justify-between font-bold">
              <span>TOTAL:</span>
              <span>$75.00</span>
            </div>
            {receiptFooter && (
              <div className="text-center text-xs border-t pt-2 whitespace-pre-wrap">
                {receiptFooter}
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </CardContent>
    </Card>
  );
}
