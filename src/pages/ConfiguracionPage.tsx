import { useState, forwardRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { BusinessSettings } from "@/components/settings/BusinessSettings";
import { TaxSettings } from "@/components/settings/TaxSettings";
import { ReceiptSettings } from "@/components/settings/ReceiptSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { BranchManagement } from "@/components/settings/BranchManagement";
import { PaymentMethodsSettings } from "@/components/settings/PaymentMethodsSettings";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { FiscalSettings } from "@/components/settings/FiscalSettings";
import { useCompany } from "@/contexts/CompanyContext";
import { User, Building2, Percent, Receipt, Palette, Settings, GitBranch, CreditCard, Globe, FileText } from "lucide-react";

const ConfiguracionPage = forwardRef<HTMLDivElement>((_, ref) => {
  const [activeTab, setActiveTab] = useState("profile");
  const { userRole } = useCompany();

  return (
    <div ref={ref} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu cuenta y negocio
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger 
            value="business"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Negocio</span>
          </TabsTrigger>
          <TabsTrigger 
            value="taxes"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Impuestos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="receipts"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Recibos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="appearance"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          {userRole === "owner" && (
            <>
              <TabsTrigger 
                value="payment-methods"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger>
              <TabsTrigger 
                value="currency"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Moneda</span>
              </TabsTrigger>
              <TabsTrigger 
                value="branches"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">Sucursales</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fiscal"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Facturación</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <BusinessSettings />
        </TabsContent>

        <TabsContent value="taxes" className="mt-6">
          <TaxSettings />
        </TabsContent>

        <TabsContent value="receipts" className="mt-6">
          <ReceiptSettings />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettings />
        </TabsContent>

        {userRole === "owner" && (
          <>
            <TabsContent value="payment-methods" className="mt-6">
              <PaymentMethodsSettings />
            </TabsContent>
            <TabsContent value="currency" className="mt-6">
              <CurrencySettings />
            </TabsContent>
            <TabsContent value="branches" className="mt-6">
              <BranchManagement />
            </TabsContent>
            <TabsContent value="fiscal" className="mt-6">
              <FiscalSettings />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
});

ConfiguracionPage.displayName = "ConfiguracionPage";

export default ConfiguracionPage;
