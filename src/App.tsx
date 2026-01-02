import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import POSPage from "./pages/POSPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import CajaPage from "./pages/CajaPage";
import ReservasPage from "./pages/ReservasPage";
import AuthPage from "./pages/AuthPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ReportesPage from "./pages/ReportesPage";
import ClientesPage from "./pages/ClientesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/productos" element={<ProductsPage />} />
                <Route path="/categorias" element={<PlaceholderPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/ventas" element={<SalesPage />} />
                <Route path="/caja" element={<CajaPage />} />
                <Route path="/reservas" element={<ReservasPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/configuracion" element={<PlaceholderPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
