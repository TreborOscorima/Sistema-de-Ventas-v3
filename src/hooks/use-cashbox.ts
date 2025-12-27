import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  CashboxSession,
  CashboxMovement,
  getActiveSession,
  openSession,
  closeSession,
  getSessionMovements,
  addMovement,
  getSessionHistory,
  calculateSessionTotals
} from '@/lib/cashbox';

export function useCashbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeSession, setActiveSession] = useState<CashboxSession | null>(null);
  const [movements, setMovements] = useState<CashboxMovement[]>([]);
  const [sessionHistory, setSessionHistory] = useState<CashboxSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const session = await getActiveSession(user.id);
      setActiveSession(session);

      if (session) {
        const movs = await getSessionMovements(session.id);
        setMovements(movs);
      } else {
        setMovements([]);
      }

      const history = await getSessionHistory(user.id);
      setSessionHistory(history);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpenSession = async (openingAmount: number) => {
    if (!user) return;
    
    try {
      const session = await openSession(user.id, openingAmount);
      setActiveSession(session);
      setMovements([]);
      toast({
        title: 'Caja abierta',
        description: `Sesión iniciada con S/ ${openingAmount.toFixed(2)}`
      });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al abrir caja';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleCloseSession = async (closingAmount: number, notes?: string) => {
    if (!user || !activeSession) return;
    
    const totals = calculateSessionTotals(movements, Number(activeSession.opening_amount));
    
    try {
      await closeSession(
        activeSession.id,
        closingAmount,
        totals.expectedCash,
        notes
      );
      toast({
        title: 'Caja cerrada',
        description: 'La sesión ha sido cerrada exitosamente'
      });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar caja';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleAddMovement = async (
    type: CashboxMovement['type'],
    amount: number,
    description: string,
    paymentMethod?: CashboxMovement['payment_method']
  ) => {
    if (!user || !activeSession) return;
    
    try {
      await addMovement(
        activeSession.id,
        user.id,
        type,
        amount,
        description,
        paymentMethod
      );
      toast({
        title: 'Movimiento registrado',
        description: `${type === 'income' ? 'Ingreso' : type === 'expense' ? 'Egreso' : type === 'sale' ? 'Venta' : 'Movimiento'} de S/ ${amount.toFixed(2)}`
      });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar movimiento';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const totals = activeSession 
    ? calculateSessionTotals(movements, Number(activeSession.opening_amount))
    : null;

  return {
    activeSession,
    movements,
    sessionHistory,
    loading,
    error,
    totals,
    refresh,
    openSession: handleOpenSession,
    closeSession: handleCloseSession,
    addMovement: handleAddMovement
  };
}
