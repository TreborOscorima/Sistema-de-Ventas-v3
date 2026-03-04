import { Navigate, Outlet } from "react-router-dom";
import { useCompany, AppRole } from "@/contexts/CompanyContext";

interface RoleRouteProps {
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RoleRoute({ allowedRoles, redirectTo }: RoleRouteProps) {
  const { userRole } = useCompany();

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Cashiers go to /pos, others go to /
    const fallback = redirectTo || (userRole === "cashier" ? "/pos" : "/");
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
