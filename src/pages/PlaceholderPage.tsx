import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center">
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm animate-scale-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">{pageName || "Página"}</h2>
        <p className="text-muted-foreground">
          Esta sección está en desarrollo.
        </p>
      </div>
    </div>
  );
}
