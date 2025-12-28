import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Reservation } from "@/lib/reservations";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  User,
  Phone
} from "lucide-react";

interface ReservationListProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => void;
  onPrintReceipt: (reservation: Reservation) => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
  confirmed: { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle },
  completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
};

export function ReservationList({
  reservations,
  onEdit,
  onDelete,
  onStatusChange,
  onPrintReceipt
}: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay reservas para esta fecha
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => {
        const status = statusConfig[reservation.status];
        const StatusIcon = status.icon;

        return (
          <Card key={reservation.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">
                      {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
                    </span>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {reservation.court?.name} • {reservation.court?.sport_type}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.customer_name}</span>
                    </div>
                    {reservation.customer_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {reservation.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {reservation.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-lg">
                    ${reservation.total_amount.toLocaleString()}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(reservation)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrintReceipt(reservation)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Imprimir Constancia
                      </DropdownMenuItem>
                      {reservation.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onStatusChange(reservation.id, 'confirmed')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar
                        </DropdownMenuItem>
                      )}
                      {reservation.status === 'confirmed' && (
                        <DropdownMenuItem onClick={() => onStatusChange(reservation.id, 'completed')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completar
                        </DropdownMenuItem>
                      )}
                      {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                        <DropdownMenuItem 
                          onClick={() => onStatusChange(reservation.id, 'cancelled')}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete(reservation.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
