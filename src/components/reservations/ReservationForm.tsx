import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Court, Reservation, calculateTotal, checkCourtAvailability } from "@/lib/reservations";
import { format } from "date-fns";

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  courts: Court[];
  selectedDate: Date;
  reservation?: Reservation | null;
}

export function ReservationForm({
  open,
  onClose,
  onSubmit,
  courts,
  selectedDate,
  reservation
}: ReservationFormProps) {
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    conflictingReservation?: Reservation;
  } | null>(null);
  const [formData, setFormData] = useState({
    court_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    start_time: '08:00',
    end_time: '09:00',
    notes: '',
    status: 'pending'
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        court_id: reservation.court_id,
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone || '',
        customer_email: reservation.customer_email || '',
        start_time: reservation.start_time.slice(0, 5),
        end_time: reservation.end_time.slice(0, 5),
        notes: reservation.notes || '',
        status: reservation.status
      });
    } else {
      setFormData({
        court_id: courts[0]?.id || '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        start_time: '08:00',
        end_time: '09:00',
        notes: '',
        status: 'pending'
      });
    }
  }, [reservation, courts, open]);

  // Check availability when court, date, or time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.court_id || !formData.start_time || !formData.end_time) {
        setAvailabilityStatus(null);
        return;
      }

      // Validate time order
      if (formData.start_time >= formData.end_time) {
        setAvailabilityStatus(null);
        return;
      }

      setCheckingAvailability(true);
      try {
        const result = await checkCourtAvailability(
          formData.court_id,
          format(selectedDate, 'yyyy-MM-dd'),
          formData.start_time,
          formData.end_time,
          reservation?.id
        );
        setAvailabilityStatus(result);
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityStatus(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const debounceTimer = setTimeout(checkAvailability, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.court_id, formData.start_time, formData.end_time, selectedDate, reservation?.id]);

  const selectedCourt = courts.find(c => c.id === formData.court_id);
  const totalAmount = selectedCourt 
    ? calculateTotal(selectedCourt.price_per_hour, formData.start_time, formData.end_time)
    : 0;

  // Validate time order
  const isTimeValid = formData.start_time < formData.end_time;
  
  // Validate times are within court availability
  const isWithinCourtHours = (() => {
    if (!selectedCourt) return true;
    const openingTime = selectedCourt.opening_time?.slice(0, 5) || '00:00';
    const closingTime = selectedCourt.closing_time?.slice(0, 5) || '23:30';
    return formData.start_time >= openingTime && formData.end_time <= closingTime;
  })();

  const canSubmit = isTimeValid && isWithinCourtHours && availabilityStatus?.available && !checkingAvailability;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setLoading(true);
    try {
      // Double-check availability before submitting
      const finalCheck = await checkCourtAvailability(
        formData.court_id,
        format(selectedDate, 'yyyy-MM-dd'),
        formData.start_time,
        formData.end_time,
        reservation?.id
      );

      if (!finalCheck.available) {
        setAvailabilityStatus(finalCheck);
        return;
      }

      await onSubmit({
        ...formData,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        total_amount: totalAmount
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on selected court's availability
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const court = selectedCourt;
    const openingHour = court?.opening_time ? parseInt(court.opening_time.slice(0, 2)) : 0;
    const openingMinute = court?.opening_time ? parseInt(court.opening_time.slice(3, 5)) : 0;
    const closingHour = court?.closing_time ? parseInt(court.closing_time.slice(0, 2)) : 23;
    const closingMinute = court?.closing_time ? parseInt(court.closing_time.slice(3, 5)) : 30;
    
    for (let h = openingHour; h <= closingHour; h++) {
      for (const m of [0, 30]) {
        // Skip minutes before opening on opening hour
        if (h === openingHour && m < openingMinute) continue;
        // Skip minutes after closing on closing hour
        if (h === closingHour && m > closingMinute) continue;
        
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="court">Cancha</Label>
            <Select
              value={formData.court_id}
              onValueChange={(value) => setFormData({ ...formData, court_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cancha" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name} - {court.sport_type} (${court.price_per_hour.toLocaleString()}/h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customer_name">Nombre del Cliente *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_phone">Teléfono</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Hora Inicio</Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) => setFormData({ ...formData, start_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end_time">Hora Fin</Label>
              <Select
                value={formData.end_time}
                onValueChange={(value) => setFormData({ ...formData, end_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Availability Status */}
          {formData.court_id && formData.start_time && formData.end_time && (
            <div>
              {checkingAvailability ? (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Verificando disponibilidad...</AlertDescription>
                </Alert>
              ) : !isTimeValid ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La hora de fin debe ser posterior a la hora de inicio
                  </AlertDescription>
                </Alert>
              ) : !isWithinCourtHours ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    El horario seleccionado está fuera del horario de disponibilidad de la cancha 
                    ({selectedCourt?.opening_time?.slice(0, 5) || '00:00'} - {selectedCourt?.closing_time?.slice(0, 5) || '23:30'})
                  </AlertDescription>
                </Alert>
              ) : availabilityStatus?.available ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Horario disponible
                  </AlertDescription>
                </Alert>
              ) : availabilityStatus?.conflictingReservation ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Horario no disponible. Ya existe una reserva de{' '}
                    <strong>{availabilityStatus.conflictingReservation.customer_name}</strong>{' '}
                    de {availabilityStatus.conflictingReservation.start_time.slice(0, 5)} a{' '}
                    {availabilityStatus.conflictingReservation.end_time.slice(0, 5)}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}

          {reservation && (
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Guardando...' : (reservation ? 'Actualizar' : 'Crear Reserva')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
