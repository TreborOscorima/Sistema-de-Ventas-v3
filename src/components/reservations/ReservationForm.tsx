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
import { Court, Reservation, calculateTotal } from "@/lib/reservations";
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

  const selectedCourt = courts.find(c => c.id === formData.court_id);
  const totalAmount = selectedCourt 
    ? calculateTotal(selectedCourt.price_per_hour, formData.start_time, formData.end_time)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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

  const timeSlots = [];
  for (let h = 6; h <= 23; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (reservation ? 'Actualizar' : 'Crear Reserva')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
