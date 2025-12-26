import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import POSPage from "./pages/POSPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/categorias" element={<PlaceholderPage />} />
            <Route path="/clientes" element={<PlaceholderPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            <Route path="/caja" element={<PlaceholderPage />} />
            <Route path="/reservas" element={<PlaceholderPage />} />
            <Route path="/reportes" element={<PlaceholderPage />} />
            <Route path="/configuracion" element={<PlaceholderPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
