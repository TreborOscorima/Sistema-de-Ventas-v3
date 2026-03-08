import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LATAM_CURRENCIES, formatCurrency } from "@/lib/currency";
import { Globe, Save, Loader2 } from "lucide-react";

export const CurrencySettings = forwardRef<HTMLDivElement>((_, ref) => {
  const { company, refreshCompany } = useCompany();
  const { toast } = useToast();
  const [currency, setCurrency] = useState("PEN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setCurrency((company as any).currency || 'PEN');
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ currency } as any)
        .eq('id', company.id);
      if (error) throw error;
      await refreshCompany();
      toast({ title: "Moneda actualizada", description: "La moneda se ha guardado correctamente" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrency = LATAM_CURRENCIES.find(c => c.code === currency);

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Moneda
        </CardTitle>
        <CardDescription>
          Selecciona la moneda que se usará en todo el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Moneda principal</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LATAM_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm w-8">{c.symbol}</span>
                    <span>{c.name}</span>
                    <span className="text-muted-foreground text-xs">({c.code})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurrency && (
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground mb-1">Vista previa</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(1234.56, currency)}
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando..." : "Guardar moneda"}
        </Button>
      </CardContent>
    </Card>
  );
});

CurrencySettings.displayName = "CurrencySettings";
