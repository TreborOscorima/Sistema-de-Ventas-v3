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
import { MoreVertical, Pencil, Trash2, DollarSign, Clock, Moon } from "lucide-react";

// Default court images by sport type
import futbolDefault from "@/assets/default-courts/futbol.jpg";
import voleyDefault from "@/assets/default-courts/voley.jpg";
import padelDefault from "@/assets/default-courts/padel.jpg";
import tenisDefault from "@/assets/default-courts/tenis.jpg";
import basquetDefault from "@/assets/default-courts/basquet.jpg";

const defaultCourtImages: Record<string, string> = {
  futbol: futbolDefault,
  futbol5: futbolDefault,
  futbol7: futbolDefault,
  futbol11: futbolDefault,
  padel: padelDefault,
  tenis: tenisDefault,
  basquet: basquetDefault,
  voley: voleyDefault,
  otro: futbolDefault,
};

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
            <div className="flex items-start gap-4">
              {/* Court Image */}
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={court.image_url || defaultCourtImages[court.sport_type] || futbolDefault}
                  alt={court.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Court Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{court.name}</h3>
                  <Badge variant={court.is_active ? "default" : "secondary"}>
                    {court.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{sportTypeLabels[court.sport_type] || court.sport_type}</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {court.price_per_hour.toLocaleString('es-AR')}/hora
                  </span>
                  {court.night_price_per_hour && (
                    <span className="flex items-center gap-1">
                      <Moon className="h-3 w-3" />
                      {court.night_price_per_hour.toLocaleString('es-AR')}/hora (desde {court.night_start_time?.slice(0, 5) || '20:00'})
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {court.opening_time?.slice(0, 5) || '00:00'} - {court.closing_time?.slice(0, 5) || '23:30'}
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
