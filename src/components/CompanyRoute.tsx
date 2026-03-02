import { Navigate, Outlet } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { Loader2 } from "lucide-react";

export function CompanyRoute() {
  const { loading, needsOnboarding } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
