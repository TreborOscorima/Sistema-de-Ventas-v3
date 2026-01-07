import { Court } from "@/lib/reservations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, DollarSign } from "lucide-react";

interface CourtListProps {
  courts: Court[];
  onEdit: (court: Court) => void;
  onDelete: (id: string) => void;
}

const sportTypeLabels: Record<string, string> = {
  futbol: "Fútbol",
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11",
  padel: "Pádel",
  tenis: "Tenis",
  basquet: "Básquet",
  voley: "Vóley",
  otro: "Otro",
};

export function CourtList({ courts, onEdit, onDelete }: CourtListProps) {
  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay canchas registradas. Crea una para comenzar.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {courts.map((court) => (
        <Card key={court.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{court.name}</h3>
                  <Badge variant={court.is_active ? "default" : "secondary"}>
                    {court.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{sportTypeLabels[court.sport_type] || court.sport_type}</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {court.price_per_hour.toLocaleString('es-AR')}/hora
                  </span>
                </div>
                {court.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {court.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(court)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(court.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
