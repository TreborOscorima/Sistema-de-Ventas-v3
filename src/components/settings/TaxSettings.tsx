import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/use-settings";
import { Percent, Receipt, Save, Loader2 } from "lucide-react";

export function TaxSettings() {
  const { data: settings, isLoading } = useBusinessSettings();
  const updateSettings = useUpdateBusinessSettings();

  const [taxRate, setTaxRate] = useState(0);
  const [taxName, setTaxName] = useState("IVA");
  const [showTaxOnReceipt, setShowTaxOnReceipt] = useState(true);

  useEffect(() => {
    if (settings) {
      setTaxRate(settings.tax_rate);
      setTaxName(settings.tax_name);
      setShowTaxOnReceipt(settings.show_tax_on_receipt);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      tax_rate: taxRate,
      tax_name: taxName,
      show_tax_on_receipt: showTaxOnReceipt,
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
          <Percent className="h-5 w-5" />
          Configuración de Impuestos
        </CardTitle>
        <CardDescription>
          Configura el porcentaje de impuestos aplicable a las ventas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxName">Nombre del impuesto</Label>
            <Input
              id="taxName"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="IVA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Porcentaje (%)</Label>
            <div className="relative">
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="pr-10"
                placeholder="16"
              />
              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Mostrar impuesto en recibo
            </Label>
            <p className="text-sm text-muted-foreground">
              Muestra el desglose del impuesto en los recibos de venta
            </p>
          </div>
          <Switch
            checked={showTaxOnReceipt}
            onCheckedChange={setShowTaxOnReceipt}
          />
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="font-medium mb-2">Vista previa</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>$100.00</span>
            </div>
            {showTaxOnReceipt && taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{taxName} ({taxRate}%):</span>
                <span>${(100 * taxRate / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-1 mt-1">
              <span>Total:</span>
              <span>${(100 + (100 * taxRate / 100)).toFixed(2)}</span>
            </div>
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
