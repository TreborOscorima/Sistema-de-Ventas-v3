import { Navigate, Outlet } from "react-router-dom";
import { useCompany, ModuleKey } from "@/contexts/CompanyContext";

interface PermissionRouteProps {
  module: ModuleKey;
  redirectTo?: string;
}

export function PermissionRoute({ module, redirectTo }: PermissionRouteProps) {
  const { hasModuleAccess, userRole } = useCompany();

  if (!hasModuleAccess(module)) {
    const fallback = redirectTo || (userRole === "cashier" ? "/pos" : "/");
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
