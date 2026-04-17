import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, FileText, AlertTriangle, CheckCircle2, FlaskConical, Building2 } from "lucide-react";
import { useFiscalSettings, useUpdateFiscalSettings } from "@/hooks/use-fiscal-settings";
import { AR_IVA_LABELS, ArIvaCondition, FiscalCountry, FiscalMode, validateRUC, validateCUIT } from "@/lib/fiscal";
import { DocumentSeriesManager } from "./DocumentSeriesManager";

export function FiscalSettings() {
  const { data: settings, isLoading } = useFiscalSettings();
  const update = useUpdateFiscalSettings();

  const [enabled, setEnabled] = useState(false);
  const [country, setCountry] = useState<FiscalCountry>("PE");
  const [mode, setMode] = useState<FiscalMode>("testing");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [ubigeo, setUbigeo] = useState("");
  const [arIva, setArIva] = useState<ArIvaCondition>("responsable_inscripto");
  const [arGrossIncome, setArGrossIncome] = useState("");
  const [arActivityStart, setArActivityStart] = useState("");
  const [arPos, setArPos] = useState<number>(1);
  const [peCompanyCode, setPeCompanyCode] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const [emailToCustomer, setEmailToCustomer] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setCountry(settings.country);
    setMode(settings.mode);
    setLegalName(settings.legal_name || "");
    setTradeName(settings.trade_name || "");
    setTaxId(settings.tax_id || "");
    setFiscalAddress(settings.fiscal_address || "");
    setUbigeo(settings.ubigeo || "");
    setArIva(settings.ar_iva_condition || "responsable_inscripto");
    setArGrossIncome(settings.ar_gross_income || "");
    setArActivityStart(settings.ar_activity_start || "");
    setArPos(settings.ar_point_of_sale || 1);
    setPeCompanyCode(settings.pe_company_code || "");
    setAutoSend(settings.auto_send);
    setEmailToCustomer(settings.send_email_to_customer);
  }, [settings]);

  const taxIdValid = !taxId
    ? true
    : country === "PE"
    ? validateRUC(taxId)
    : validateCUIT(taxId);

  const handleSave = () => {
    update.mutate({
      enabled,
      country,
      mode,
      legal_name: legalName || null,
      trade_name: tradeName || null,
      tax_id: taxId || null,
      fiscal_address: fiscalAddress || null,
      ubigeo: country === "PE" ? ubigeo || null : null,
      ar_iva_condition: country === "AR" ? arIva : null,
      ar_gross_income: country === "AR" ? arGrossIncome || null : null,
      ar_activity_start: country === "AR" && arActivityStart ? arActivityStart : null,
      ar_point_of_sale: country === "AR" ? arPos : null,
      pe_company_code: country === "PE" ? peCompanyCode || null : null,
      auto_send: autoSend,
      send_email_to_customer: emailToCustomer,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Facturación Electrónica
              </CardTitle>
              <CardDescription>
                Configura la emisión de comprobantes electrónicos para SUNAT (Perú) o AFIP (Argentina).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {enabled ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Activa
                </Badge>
              ) : (
                <Badge variant="secondary">Inactiva</Badge>
              )}
              {mode === "testing" && (
                <Badge variant="outline" className="gap-1">
                  <FlaskConical className="h-3 w-3" /> Pruebas
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "testing" && (
            <Alert>
              <FlaskConical className="h-4 w-4" />
              <AlertTitle>Modo Pruebas / Homologación</AlertTitle>
              <AlertDescription>
                Los comprobantes emitidos NO tienen validez fiscal. Úsalo para probar la integración antes de pasar a producción.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Activar facturación electrónica</Label>
              <p className="text-sm text-muted-foreground">
                Cuando esté activa, podrás emitir comprobantes desde el POS.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={country} onValueChange={(v) => setCountry(v as FiscalCountry)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PE">🇵🇪 Perú (SUNAT / Nubefact)</SelectItem>
                  <SelectItem value="AR">🇦🇷 Argentina (AFIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entorno</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as FiscalMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="testing">Pruebas / Homologación</SelectItem>
                  <SelectItem value="production">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Datos del emisor
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Razón social</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="EMPRESA SAC" />
              </div>
              <div className="space-y-2">
                <Label>Nombre comercial</Label>
                <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Mi Negocio" />
              </div>
              <div className="space-y-2">
                <Label>{country === "PE" ? "RUC" : "CUIT"}</Label>
                <Input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value.replace(/[-\s]/g, ""))}
                  placeholder={country === "PE" ? "20123456789" : "20123456789"}
                  maxLength={11}
                />
                {taxId && !taxIdValid && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {country === "PE" ? "RUC" : "CUIT"} inválido
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Dirección fiscal</Label>
                <Input value={fiscalAddress} onChange={(e) => setFiscalAddress(e.target.value)} />
              </div>
            </div>
          </div>

          {country === "PE" && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">🇵🇪 Datos específicos Perú</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ubigeo (6 dígitos)</Label>
                  <Input value={ubigeo} onChange={(e) => setUbigeo(e.target.value)} placeholder="150101" maxLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Código de establecimiento anexo</Label>
                  <Input value={peCompanyCode} onChange={(e) => setPeCompanyCode(e.target.value)} placeholder="0000 (casa matriz)" />
                </div>
              </div>
            </div>
          )}

          {country === "AR" && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">🇦🇷 Datos específicos Argentina</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Condición frente al IVA</Label>
                  <Select value={arIva} onValueChange={(v) => setArIva(v as ArIvaCondition)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(AR_IVA_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Punto de venta AFIP</Label>
                  <Input
                    type="number"
                    min="1"
                    value={arPos}
                    onChange={(e) => setArPos(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ingresos brutos</Label>
                  <Input value={arGrossIncome} onChange={(e) => setArGrossIncome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Inicio de actividades</Label>
                  <Input type="date" value={arActivityStart} onChange={(e) => setArActivityStart(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Comportamiento</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Envío automático al cerrar venta</Label>
                <p className="text-sm text-muted-foreground">Emite el comprobante apenas se procesa la venta en el POS.</p>
              </div>
              <Switch checked={autoSend} onCheckedChange={setAutoSend} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Enviar comprobante al email del cliente</Label>
                <p className="text-sm text-muted-foreground">Envía PDF del comprobante al cliente (si tiene email registrado).</p>
              </div>
              <Switch checked={emailToCustomer} onCheckedChange={setEmailToCustomer} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={update.isPending || (!!taxId && !taxIdValid)} className="gap-2">
            <Save className="h-4 w-4" />
            {update.isPending ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="series" className="space-y-4">
        <TabsList>
          <TabsTrigger value="series">Series y correlativos</TabsTrigger>
          <TabsTrigger value="credentials">Credenciales del PSE</TabsTrigger>
        </TabsList>
        <TabsContent value="series">
          <DocumentSeriesManager country={country} />
        </TabsContent>
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales del Proveedor</CardTitle>
              <CardDescription>
                Las credenciales de acceso al PSE se gestionan como secretos seguros del backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {country === "PE" ? (
                <Alert>
                  <AlertTitle>Nubefact (Perú)</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>Necesitarás los siguientes datos de tu cuenta de Nubefact:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><code>NUBEFACT_TOKEN</code> — Token único asignado a tu RUC</li>
                      <li><code>NUBEFACT_URL</code> — URL única del API (ej. https://api.nubefact.com/api/v1/XXXXX)</li>
                    </ul>
                    <p className="text-sm mt-2">Estas credenciales se solicitarán cuando avancemos a la <strong>Fase 2: Emisión PE</strong>.</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle>AFIP (Argentina)</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>Necesitarás un certificado X.509 generado en el portal AFIP:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><code>AFIP_CERT</code> — Contenido del archivo .crt</li>
                      <li><code>AFIP_PRIVATE_KEY</code> — Contenido del archivo .key</li>
                      <li><code>AFIP_CUIT</code> — Tu CUIT de emisor</li>
                    </ul>
                    <p className="text-sm mt-2">Estas credenciales se solicitarán cuando avancemos a la <strong>Fase 3: Emisión AR</strong>.</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
