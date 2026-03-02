import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange, PeriodType } from './use-sales-reports';

export interface CashboxReportData {
  totalSessions: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  averageSessionDuration: number;
  incomeByPaymentMethod: Record<string, number>;
  movementsByType: Record<string, { count: number; amount: number }>;
  sessionsSummary: {
    id: string;
    openedAt: string;
    closedAt: string | null;
    openingAmount: number;
    closingAmount: number | null;
    expectedAmount: number | null;
    difference: number | null;
    status: string;
    totalMovements: number;
    totalSales: number;
  }[];
}

export function useCashboxReports() {
  const { user } = useAuth();
  const { activeBranch } = useCompany();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom':
        return customRange;
      default:
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
    }
  }, [period, customRange]);

  const [reportData, setReportData] = useState<CashboxReportData>({
    totalSessions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    averageSessionDuration: 0,
    incomeByPaymentMethod: {},
    movementsByType: {},
    sessionsSummary: []
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch cashbox sessions within date range
      let sessionsQuery = supabase
        .from('cashbox_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('opened_at', dateRange.from.toISOString())
        .lte('opened_at', dateRange.to.toISOString())
        .order('opened_at', { ascending: false });
      if (activeBranch?.id) sessionsQuery = sessionsQuery.eq('branch_id', activeBranch.id);

      const { data: sessions, error: sessionsError } = await sessionsQuery;

      // Fetch movements for these sessions
      const sessionIds = sessions?.map(s => s.id) || [];
      let movements: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: movementsData, error: movementsError } = await supabase
          .from('cashbox_movements')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false });
        
        if (movementsError) throw movementsError;
        movements = movementsData || [];
      }

      // Calculate metrics
      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeByPaymentMethod: Record<string, number> = {};
      const movementsByType: Record<string, { count: number; amount: number }> = {};

      movements.forEach(movement => {
        const amount = Number(movement.amount);
        
        // Track by type
        if (!movementsByType[movement.type]) {
          movementsByType[movement.type] = { count: 0, amount: 0 };
        }
        movementsByType[movement.type].count++;
        movementsByType[movement.type].amount += amount;

        if (amount > 0) {
          totalIncome += amount;
          // Track income by payment method
          const method = movement.payment_method || 'cash';
          incomeByPaymentMethod[method] = (incomeByPaymentMethod[method] || 0) + amount;
        } else {
          totalExpenses += Math.abs(amount);
        }
      });

      // Calculate average session duration
      let totalDuration = 0;
      let closedSessionsCount = 0;
      
      sessions?.forEach(session => {
        if (session.closed_at) {
          const opened = parseISO(session.opened_at);
          const closed = parseISO(session.closed_at);
          totalDuration += (closed.getTime() - opened.getTime()) / (1000 * 60 * 60); // hours
          closedSessionsCount++;
        }
      });

      const averageSessionDuration = closedSessionsCount > 0 ? totalDuration / closedSessionsCount : 0;

      // Create sessions summary
      const sessionsSummary = sessions?.map(session => {
        const sessionMovements = movements.filter(m => m.session_id === session.id);
        const salesMovements = sessionMovements.filter(m => m.type === 'sale' || m.type === 'reservation');
        
        return {
          id: session.id,
          openedAt: session.opened_at,
          closedAt: session.closed_at,
          openingAmount: Number(session.opening_amount),
          closingAmount: session.closing_amount ? Number(session.closing_amount) : null,
          expectedAmount: session.expected_amount ? Number(session.expected_amount) : null,
          difference: session.difference ? Number(session.difference) : null,
          status: session.status,
          totalMovements: sessionMovements.length,
          totalSales: salesMovements.reduce((sum, m) => sum + Number(m.amount), 0)
        };
      }) || [];

      setReportData({
        totalSessions: sessions?.length || 0,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        averageSessionDuration,
        incomeByPaymentMethod,
        movementsByType,
        sessionsSummary
      });
    } catch (error) {
      console.error('Error loading cashbox report data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, activeBranch?.id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  return {
    reportData,
    loading,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    refresh: loadReportData
  };
}
