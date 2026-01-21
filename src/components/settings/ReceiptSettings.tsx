import { useEffect, useState, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/use-settings";
import { Receipt, Image, FileText, Save, Loader2, Printer } from "lucide-react";

export const ReceiptSettings = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: settings, isLoading } = useBusinessSettings();
  const updateSettings = useUpdateBusinessSettings();

  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(false);
  const [thermalPaperSize, setThermalPaperSize] = useState<"58mm" | "80mm">("80mm");

  useEffect(() => {
    if (settings) {
      setReceiptHeader(settings.receipt_header || "");
      setReceiptFooter(settings.receipt_footer || "");
      setShowLogoOnReceipt(settings.show_logo_on_receipt);
      setThermalPaperSize((settings as any).thermal_paper_size || "80mm");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      receipt_header: receiptHeader || null,
      receipt_footer: receiptFooter || null,
      show_logo_on_receipt: showLogoOnReceipt,
      thermal_paper_size: thermalPaperSize,
    } as any);
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
        {/* Thermal Paper Size Selection */}
        <div className="rounded-lg border p-4 space-y-3">
          <Label className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Tamaño de papel térmico
          </Label>
          <p className="text-sm text-muted-foreground">
            Selecciona el ancho de papel de tu impresora térmica
          </p>
          <RadioGroup
            value={thermalPaperSize}
            onValueChange={(value) => setThermalPaperSize(value as "58mm" | "80mm")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="58mm" id="paper-58mm" />
              <Label htmlFor="paper-58mm" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">58mm</span>
                  <span className="text-xs text-muted-foreground">~32 caracteres</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="80mm" id="paper-80mm" />
              <Label htmlFor="paper-80mm" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">80mm</span>
                  <span className="text-xs text-muted-foreground">~42 caracteres</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

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
});

ReceiptSettings.displayName = "ReceiptSettings";
