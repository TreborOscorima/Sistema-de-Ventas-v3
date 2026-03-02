import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { 
  Court, 
  Reservation, 
  getCourts, 
  getReservations, 
  getReservationsByDate,
  createReservation, 
  updateReservation, 
  deleteReservation,
  updateReservationStatus,
  createCourt,
  updateCourt,
  deleteCourt
} from '@/lib/reservations';
import { toast } from 'sonner';

export function useReservations() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { activeBranch } = useCompany();

  const loadCourts = useCallback(async (includeInactive = false) => {
    try {
      const data = await getCourts(includeInactive, activeBranch?.id);
      setCourts(data);
    } catch (error) {
      console.error('Error loading courts:', error);
      toast.error('Error al cargar las canchas');
    }
  }, [activeBranch?.id]);

  const loadReservations = useCallback(async (date?: Date) => {
    try {
      setLoading(true);
      const dateStr = (date || selectedDate).toISOString().split('T')[0];
      const data = await getReservationsByDate(dateStr, activeBranch?.id);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeBranch?.id]);

  const loadAllReservations = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const data = await getReservations(startDate, endDate, activeBranch?.id);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    loadCourts();
    loadReservations();
  }, [loadCourts, loadReservations]);

  const addReservation = async (reservation: Parameters<typeof createReservation>[0]) => {
    try {
      await createReservation(reservation, activeBranch?.id);
      toast.success('Reserva creada exitosamente');
      await loadReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
      throw error;
    }
  };

  const editReservation = async (id: string, updates: Parameters<typeof updateReservation>[1]) => {
    try {
      await updateReservation(id, updates);
      toast.success('Reserva actualizada');
      await loadReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('Error al actualizar la reserva');
      throw error;
    }
  };

  const removeReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      toast.success('Reserva eliminada');
      await loadReservations();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al eliminar la reserva');
      throw error;
    }
  };

  const changeStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateReservationStatus(id, status);
      const statusMessages = {
        pending: 'Reserva marcada como pendiente',
        confirmed: 'Reserva confirmada',
        cancelled: 'Reserva cancelada',
        completed: 'Reserva completada'
      };
      toast.success(statusMessages[status]);
      await loadReservations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al cambiar el estado');
      throw error;
    }
  };

  const changeDate = (date: Date) => {
    setSelectedDate(date);
    loadReservations(date);
  };

  const addCourt = async (court: Parameters<typeof createCourt>[0]) => {
    try {
      await createCourt(court, activeBranch?.id);
      toast.success('Cancha creada exitosamente');
      await loadCourts(true);
    } catch (error) {
      console.error('Error creating court:', error);
      toast.error('Error al crear la cancha');
      throw error;
    }
  };

  const editCourt = async (id: string, updates: Parameters<typeof updateCourt>[1]) => {
    try {
      await updateCourt(id, updates);
      toast.success('Cancha actualizada');
      await loadCourts(true);
    } catch (error) {
      console.error('Error updating court:', error);
      toast.error('Error al actualizar la cancha');
      throw error;
    }
  };

  const removeCourt = async (id: string) => {
    try {
      await deleteCourt(id);
      toast.success('Cancha eliminada');
      await loadCourts(true);
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error('Error al eliminar la cancha');
      throw error;
    }
  };

  return {
    courts,
    reservations,
    loading,
    selectedDate,
    changeDate,
    addReservation,
    editReservation,
    removeReservation,
    changeStatus,
    loadReservations,
    loadAllReservations,
    loadCourts,
    addCourt,
    editCourt,
    removeCourt,
    refresh: () => loadReservations()
  };
}
