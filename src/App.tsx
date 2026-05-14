import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CompanyRoute } from "@/components/CompanyRoute";
import { PermissionRoute } from "@/components/PermissionRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import POSPage from "./pages/POSPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriasPage from "./pages/CategoriasPage";
import SalesPage from "./pages/SalesPage";
import CajaPage from "./pages/CajaPage";
import ReservasPage from "./pages/ReservasPage";
import AuthPage from "./pages/AuthPage";
import ReportesPage from "./pages/ReportesPage";
import ClientesPage from "./pages/ClientesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import ComprasPage from "./pages/ComprasPage";
import ComprobantesPage from "./pages/ComprobantesPage";
import ReportesFiscalesPage from "./pages/ReportesFiscalesPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route element={<CompanyRoute />}>
                  <Route element={<AppLayout />}>
                    {/* Each route protected by module permission */}
                    <Route element={<PermissionRoute module="dashboard" />}>
                      <Route path="/" element={<Index />} />
                    </Route>
                    <Route element={<PermissionRoute module="pos" />}>
                      <Route path="/pos" element={<POSPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="caja" />}>
                      <Route path="/caja" element={<CajaPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="reservas" />}>
                      <Route path="/reservas" element={<ReservasPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="productos" />}>
                      <Route path="/productos" element={<ProductsPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="categorias" />}>
                      <Route path="/categorias" element={<CategoriasPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="clientes" />}>
                      <Route path="/clientes" element={<ClientesPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="ventas" />}>
                      <Route path="/ventas" element={<SalesPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="reportes" />}>
                      <Route path="/reportes" element={<ReportesPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="configuracion" />}>
                      <Route path="/configuracion" element={<ConfiguracionPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="compras" />}>
                      <Route path="/compras" element={<ComprasPage />} />
                    </Route>
                    <Route element={<PermissionRoute module="comprobantes" />}>
                      <Route path="/comprobantes" element={<ComprobantesPage />} />
                      <Route path="/reportes-fiscales" element={<ReportesFiscalesPage />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
