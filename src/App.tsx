import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CompanyRoute } from "@/components/CompanyRoute";
import { RoleRoute } from "@/components/RoleRoute";
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
                    {/* All roles */}
                    <Route path="/pos" element={<POSPage />} />
                    <Route path="/caja" element={<CajaPage />} />

                    {/* Owner & Admin only */}
                    <Route element={<RoleRoute allowedRoles={["owner", "admin"]} />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/productos" element={<ProductsPage />} />
                      <Route path="/categorias" element={<CategoriasPage />} />
                      <Route path="/clientes" element={<ClientesPage />} />
                      <Route path="/ventas" element={<SalesPage />} />
                      <Route path="/reservas" element={<ReservasPage />} />
                      <Route path="/reportes" element={<ReportesPage />} />
                      <Route path="/configuracion" element={<ConfiguracionPage />} />
                      <Route path="/compras" element={<ComprasPage />} />
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
