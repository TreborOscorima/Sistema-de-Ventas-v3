import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Store, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const { createCompanyAndBranch } = useCompany();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [branchName, setBranchName] = useState("Principal");
  const [branchAddress, setBranchAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!companyName.trim() || !branchName.trim()) return;

    try {
      setSaving(true);
      await createCompanyAndBranch(companyName.trim(), branchName.trim(), branchAddress.trim() || undefined);
      toast({
        title: "¡Bienvenido!",
        description: "Tu empresa y sucursal han sido creadas correctamente",
      });
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la empresa",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Store className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Configura tu negocio</h1>
          <p className="text-muted-foreground">
            Vamos a crear tu empresa y primera sucursal
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos de la empresa
              </CardTitle>
              <CardDescription>
                El nombre de tu empresa aparecerá en los recibos y reportes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mi Empresa S.A.C."
                  autoFocus
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!companyName.trim()}
                className="w-full gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Primera sucursal
              </CardTitle>
              <CardDescription>
                Configura tu sucursal principal. Podrás agregar más después.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Nombre de la sucursal *</Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Sucursal Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchAddress">Dirección (opcional)</Label>
                <Input
                  id="branchAddress"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Av. Principal #123"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!branchName.trim() || saving}
                  className="flex-1 gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Comenzar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-2">
          <div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>
    </div>
  );
}
