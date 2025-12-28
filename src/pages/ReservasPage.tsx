import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, RefreshCw } from "lucide-react";
import { useReservations } from "@/hooks/use-reservations";
import { ReservationCalendar } from "@/components/reservations/ReservationCalendar";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { ReservationList } from "@/components/reservations/ReservationList";
import { ReservationReceipt } from "@/components/reservations/ReservationReceipt";
import { Reservation } from "@/lib/reservations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReservasPage() {
  const {
    courts,
    reservations,
    loading,
    selectedDate,
    changeDate,
    addReservation,
    editReservation,
    removeReservation,
    changeStatus,
    refresh
  } = useReservations();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptReservation, setReceiptReservation] = useState<Reservation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedReservation) {
      await editReservation(selectedReservation.id, data);
    } else {
      await addReservation(data);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedReservation(null);
  };

  const handleDelete = (id: string) => {
    setReservationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (reservationToDelete) {
      await removeReservation(reservationToDelete);
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
    }
  };

  const handlePrintReceipt = (reservation: Reservation) => {
    setReceiptReservation(reservation);
    setReceiptOpen(true);
  };

  const todayReservations = reservations.filter(r => r.status !== 'cancelled');
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">
            Gestiona las reservas de canchas deportivas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas del Día</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ReservationCalendar
          selectedDate={selectedDate}
          onDateSelect={changeDate}
          reservations={reservations}
        />

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </h2>
          </div>
          
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Cargando reservas...
              </CardContent>
            </Card>
          ) : (
            <ReservationList
              reservations={reservations}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={changeStatus}
              onPrintReceipt={handlePrintReceipt}
            />
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <ReservationForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        courts={courts}
        selectedDate={selectedDate}
        reservation={selectedReservation}
      />

      {/* Receipt Dialog */}
      <ReservationReceipt
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        reservation={receiptReservation}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La reserva será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
