import { useState, useMemo } from 'react';
import { useSalesReports } from '@/hooks/use-sales-reports';
import { useCategoryReports } from '@/hooks/use-category-reports';
import { useReservationsReports } from '@/hooks/use-reservations-reports';
import { useCashboxReports } from '@/hooks/use-cashbox-reports';
import { useComparativeReports } from '@/hooks/use-comparative-reports';
import { usePurchasesReports } from '@/hooks/use-purchases-reports';
import { useDetailedSalesReport } from '@/hooks/use-detailed-sales-report';
import { useBranchComparison } from '@/hooks/use-branch-comparison';
import { useCustomers } from '@/hooks/use-customers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  FileText, Users, DollarSign, AlertTriangle, Download, Search, Filter, 
  BarChart3, TrendingUp, Tags, Calendar, Banknote, GitCompare,
  CalendarCheck, Percent, ShoppingCart, Package, Receipt, ClipboardList
} from 'lucide-react';

import { ReportsSummaryCards } from '@/components/reports/ReportsSummaryCards';
import { SalesOverviewChart } from '@/components/reports/SalesOverviewChart';
import { PaymentMethodsChart } from '@/components/reports/PaymentMethodsChart';
import { TopProductsTable } from '@/components/reports/TopProductsTable';
import { HourlySalesChart } from '@/components/reports/HourlySalesChart';
import { PeriodSelector } from '@/components/reports/PeriodSelector';
import { CategorySalesChart } from '@/components/reports/CategorySalesChart';
import { ReservationsOverviewChart } from '@/components/reports/ReservationsOverviewChart';
import { CourtPerformanceTable } from '@/components/reports/CourtPerformanceTable';
import { PopularTimeSlotsChart } from '@/components/reports/PopularTimeSlotsChart';
import { CashboxSessionsTable } from '@/components/reports/CashboxSessionsTable';
import { MovementsByTypeChart } from '@/components/reports/MovementsByTypeChart';
import { ComparativeCards } from '@/components/reports/ComparativeCards';
import { PurchasesOverviewChart } from '@/components/reports/PurchasesOverviewChart';
import { PurchasesBySupplierChart } from '@/components/reports/PurchasesBySupplierChart';
import { ProductCostsTable } from '@/components/reports/ProductCostsTable';
import { TaxBreakdownCard } from '@/components/reports/TaxBreakdownCard';
import { DetailedTransactionsTable } from '@/components/reports/DetailedTransactionsTable';
import { EmployeeSalesChart } from '@/components/reports/EmployeeSalesChart';
import { BranchComparisonChart } from '@/components/reports/BranchComparisonChart';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportesPage() {
  const {
    reportData: salesData, loading: salesLoading, period: salesPeriod,
    setPeriod: setSalesPeriod, customRange: salesCustomRange,
    setCustomRange: setSalesCustomRange, refresh: refreshSales
  } = useSalesReports();

  const {
    reportData: categoryData, loading: categoryLoading, period: categoryPeriod,
    setPeriod: setCategoryPeriod, customRange: categoryCustomRange,
    setCustomRange: setCategoryCustomRange, refresh: refreshCategory
  } = useCategoryReports();

  const {
    reportData: reservationsData, loading: reservationsLoading,
    period: reservationsPeriod, setPeriod: setReservationsPeriod,
    customRange: reservationsCustomRange, setCustomRange: setReservationsCustomRange,
    refresh: refreshReservations
  } = useReservationsReports();

  const {
    reportData: cashboxData, loading: cashboxLoading, period: cashboxPeriod,
    setPeriod: setCashboxPeriod, customRange: cashboxCustomRange,
    setCustomRange: setCashboxCustomRange, refresh: refreshCashbox
  } = useCashboxReports();

  const {
    reportData: comparativeData, loading: comparativeLoading,
    comparisonType, setComparisonType, refresh: refreshComparative
  } = useComparativeReports();

  const {
    reportData: purchasesData, loading: purchasesLoading,
    period: purchasesPeriod, setPeriod: setPurchasesPeriod,
    customRange: purchasesCustomRange, setCustomRange: setPurchasesCustomRange,
    refresh: refreshPurchases
  } = usePurchasesReports();

  const {
    sales: detailedSales, taxSummary, loading: detailedLoading,
    employees, selectedEmployee, setSelectedEmployee,
    period: detailedPeriod, setPeriod: setDetailedPeriod,
    customRange: detailedCustomRange, setCustomRange: setDetailedCustomRange,
    refresh: refreshDetailed
  } = useDetailedSalesReport();

  const { allCustomers, loading: customersLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('balance');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const customersWithDebt = useMemo(() => allCustomers.filter(c => c.balance < 0), [allCustomers]);

  const filteredCustomers = useMemo(() => {
    let filtered = customersWithDebt.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);
      if (!matchesSearch) return false;
      const debtAmount = Math.abs(customer.balance);
      switch (balanceFilter) {
        case 'low': return debtAmount <= 500;
        case 'medium': return debtAmount > 500 && debtAmount <= 2000;
        case 'high': return debtAmount > 2000;
        default: return true;
      }
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'balance': return a.balance - b.balance;
        case 'name': return a.name.localeCompare(b.name);
        case 'recent': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default: return 0;
      }
    });
    return filtered;
  }, [customersWithDebt, searchQuery, balanceFilter, sortBy]);

  const debtSummary = useMemo(() => {
    const totalDebt = customersWithDebt.reduce((sum, c) => sum + Math.abs(c.balance), 0);
    const avgDebt = customersWithDebt.length > 0 ? totalDebt / customersWithDebt.length : 0;
    const maxDebt = customersWithDebt.length > 0 ? Math.max(...customersWithDebt.map(c => Math.abs(c.balance))) : 0;
    const highRiskCount = customersWithDebt.filter(c => Math.abs(c.balance) > 2000).length;
    return { totalDebt, avgDebt, maxDebt, highRiskCount, count: customersWithDebt.length };
  }, [customersWithDebt]);

  // === EXPORT FUNCTIONS ===

  const exportSalesCSV = () => {
    const headers = ['Fecha', 'Ventas', 'Transacciones'];
    const rows = salesData.salesByDay.map(d => [d.date, d.sales.toFixed(2), d.transactions.toString()]);
    downloadCSV([headers, ...rows], `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportDetailedCSV = () => {
    const headers = ['Fecha/Hora', 'ID', 'Cliente', 'Cajero', 'Sucursal', 'Método Pago', 'Estado', 'Subtotal', 'Impuesto', 'Total', 'Productos'];
    const rows = detailedSales.map(s => [
      format(parseISO(s.created_at), "dd/MM/yyyy HH:mm:ss"),
      s.id, s.customer_name || '', s.user_email || '', s.branch_name || '',
      s.payment_method, s.status, s.subtotal.toFixed(2), s.tax.toFixed(2), s.total.toFixed(2),
      s.items.map(i => `${i.product_name} x${i.quantity}`).join('; ')
    ]);
    downloadCSV([headers, ...rows], `transacciones_detalladas_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportTaxCSV = () => {
    const headers = ['Método', 'Transacciones', 'Base Imponible', 'Impuesto', 'Total Bruto'];
    const rows = Object.entries(taxSummary.taxByMethod).map(([m, v]) => [
      m, v.count.toString(), v.net.toFixed(2), v.tax.toFixed(2), v.gross.toFixed(2)
    ]);
    rows.push(['TOTAL', taxSummary.salesCount.toString(), taxSummary.totalNet.toFixed(2), taxSummary.totalTax.toFixed(2), taxSummary.totalGross.toFixed(2)]);
    downloadCSV([headers, ...rows], `desglose_fiscal_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportDebtCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Deuda', 'Última Actualización'];
    const rows = filteredCustomers.map(c => [
      c.name, c.email || '', c.phone || '', Math.abs(c.balance).toFixed(2),
      new Date(c.updated_at).toLocaleDateString('es-PE')
    ]);
    downloadCSV([headers, ...rows], `cuentas_por_cobrar_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportCashboxCSV = () => {
    const headers = ['Apertura', 'Cierre', 'Estado', 'Monto Inicial', 'Ventas', 'Monto Final', 'Diferencia'];
    const rows = cashboxData.sessionsSummary.map(s => [
      format(parseISO(s.openedAt), "dd/MM/yyyy HH:mm"),
      s.closedAt ? format(parseISO(s.closedAt), "dd/MM/yyyy HH:mm") : '',
      s.status, s.openingAmount.toFixed(2), s.totalSales.toFixed(2),
      s.closingAmount?.toFixed(2) || '', s.difference?.toFixed(2) || ''
    ]);
    downloadCSV([headers, ...rows], `sesiones_caja_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportPurchasesCSV = () => {
    const headers = ['Fecha', 'Proveedor', 'Compras', 'Total'];
    const rows = purchasesData.purchasesBySupplier.map(s => [s.name, '', s.count.toString(), s.total.toFixed(2)]);
    downloadCSV([headers, ...rows], `reporte_compras_${new Date().toISOString().split('T')[0]}.csv`);
  };

  function downloadCSV(data: string[][], filename: string) {
    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  const getDebtLevel = (balance: number) => {
    const debt = Math.abs(balance);
    if (debt > 2000) return { label: 'Alto', variant: 'destructive' as const };
    if (debt > 500) return { label: 'Medio', variant: 'default' as const };
    return { label: 'Bajo', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Reportes</h1>
        <p className="page-subtitle">Análisis completo de ventas, reservas, caja, impuestos y más</p>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="sales" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Transacciones</span>
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Fiscal</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Reservas</span>
          </TabsTrigger>
          <TabsTrigger value="cashbox" className="gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Caja</span>
          </TabsTrigger>
          <TabsTrigger value="comparative" className="gap-2">
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Comparativo</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Compras</span>
          </TabsTrigger>
          <TabsTrigger value="debt" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Deudas</span>
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <PeriodSelector period={salesPeriod} onPeriodChange={setSalesPeriod} customRange={salesCustomRange} onCustomRangeChange={setSalesCustomRange} onRefresh={refreshSales} loading={salesLoading} />
          <ReportsSummaryCards totalSales={salesData.totalSales} totalTransactions={salesData.totalTransactions} averageTicket={salesData.averageTicket} totalProducts={salesData.totalProducts} cancelledSales={salesData.cancelledSales} loading={salesLoading} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><SalesOverviewChart data={salesData.salesByDay} loading={salesLoading} /></div>
            <div><PaymentMethodsChart data={salesData.salesByPaymentMethod} loading={salesLoading} /></div>
          </div>
          <HourlySalesChart data={salesData.salesByHour} loading={salesLoading} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportSalesCSV} disabled={salesLoading}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
          </div>
        </TabsContent>

        {/* NEW: Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <PeriodSelector period={detailedPeriod} onPeriodChange={setDetailedPeriod} customRange={detailedCustomRange} onCustomRangeChange={setDetailedCustomRange} onRefresh={refreshDetailed} loading={detailedLoading} />
          <EmployeeSalesChart data={detailedSales} employees={employees} loading={detailedLoading} />
          <DetailedTransactionsTable data={detailedSales} loading={detailedLoading} employees={employees} selectedEmployee={selectedEmployee} onEmployeeChange={setSelectedEmployee} onExportCSV={exportDetailedCSV} />
        </TabsContent>

        {/* NEW: Fiscal Tab */}
        <TabsContent value="fiscal" className="space-y-6">
          <PeriodSelector period={detailedPeriod} onPeriodChange={setDetailedPeriod} customRange={detailedCustomRange} onCustomRangeChange={setDetailedCustomRange} onRefresh={refreshDetailed} loading={detailedLoading} />
          <TaxBreakdownCard data={taxSummary} loading={detailedLoading} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportTaxCSV} disabled={detailedLoading}><Download className="h-4 w-4 mr-2" />Exportar Desglose Fiscal CSV</Button>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <PeriodSelector period={categoryPeriod} onPeriodChange={setCategoryPeriod} customRange={categoryCustomRange} onCustomRangeChange={setCategoryCustomRange} onRefresh={refreshCategory} loading={categoryLoading} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(categoryData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">En el período seleccionado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unidades Vendidas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryData.totalUnitsSold}</div>
                <p className="text-xs text-muted-foreground">Total de productos</p>
              </CardContent>
            </Card>
          </div>
          <CategorySalesChart data={categoryData.salesByCategory} loading={categoryLoading} />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <PeriodSelector period={salesPeriod} onPeriodChange={setSalesPeriod} customRange={salesCustomRange} onCustomRangeChange={setSalesCustomRange} onRefresh={refreshSales} loading={salesLoading} />
          <TopProductsTable data={salesData.topProducts} loading={salesLoading} />
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-6">
          <PeriodSelector period={reservationsPeriod} onPeriodChange={setReservationsPeriod} customRange={reservationsCustomRange} onCustomRangeChange={setReservationsCustomRange} onRefresh={refreshReservations} loading={reservationsLoading} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Reservas</CardTitle><CalendarCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reservationsData.totalReservations}</div><p className="text-xs text-muted-foreground">{reservationsData.completedReservations} completadas</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(reservationsData.totalRevenue)}</div><p className="text-xs text-muted-foreground">Promedio: {formatCurrency(reservationsData.averageReservationValue)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ocupación</CardTitle><Percent className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{reservationsData.occupancyRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Tasa de ocupación</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cancelaciones</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{reservationsData.cancelledReservations}</div><p className="text-xs text-muted-foreground">{reservationsData.pendingReservations} pendientes</p></CardContent></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ReservationsOverviewChart data={reservationsData.reservationsByDay} loading={reservationsLoading} />
            <CourtPerformanceTable data={reservationsData.reservationsByCourt} loading={reservationsLoading} />
          </div>
          <PopularTimeSlotsChart data={reservationsData.popularTimeSlots} loading={reservationsLoading} />
        </TabsContent>

        {/* Cashbox Tab */}
        <TabsContent value="cashbox" className="space-y-6">
          <PeriodSelector period={cashboxPeriod} onPeriodChange={setCashboxPeriod} customRange={cashboxCustomRange} onCustomRangeChange={setCashboxCustomRange} onRefresh={refreshCashbox} loading={cashboxLoading} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sesiones</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{cashboxData.totalSessions}</div><p className="text-xs text-muted-foreground">Promedio: {cashboxData.averageSessionDuration.toFixed(1)}h</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Ingresos</CardTitle><TrendingUp className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(cashboxData.totalIncome)}</div><p className="text-xs text-muted-foreground">Entradas de dinero</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Egresos</CardTitle><TrendingUp className="h-4 w-4 text-destructive rotate-180" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(cashboxData.totalExpenses)}</div><p className="text-xs text-muted-foreground">Salidas de dinero</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Balance Neto</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${cashboxData.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(cashboxData.netBalance)}</div><p className="text-xs text-muted-foreground">Ingresos - Egresos</p></CardContent></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentMethodsChart data={cashboxData.incomeByPaymentMethod} loading={cashboxLoading} />
            <MovementsByTypeChart data={cashboxData.movementsByType} loading={cashboxLoading} />
          </div>
          <CashboxSessionsTable data={cashboxData.sessionsSummary} loading={cashboxLoading} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportCashboxCSV} disabled={cashboxLoading}><Download className="h-4 w-4 mr-2" />Exportar Caja CSV</Button>
          </div>
        </TabsContent>

        {/* Comparative Tab */}
        <TabsContent value="comparative" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={comparisonType} onValueChange={(value) => setComparisonType(value as 'day' | 'week' | 'month')}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Comparar por..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoy vs Ayer</SelectItem>
                  <SelectItem value="week">Esta semana vs Anterior</SelectItem>
                  <SelectItem value="month">Este mes vs Anterior</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refreshComparative} disabled={comparativeLoading}>
                <TrendingUp className={`h-4 w-4 ${comparativeLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <ComparativeCards currentPeriod={comparativeData.currentPeriod} previousPeriod={comparativeData.previousPeriod} changes={comparativeData.changes} currentPeriodLabel={comparativeData.currentPeriodLabel} previousPeriodLabel={comparativeData.previousPeriodLabel} loading={comparativeLoading} />
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-6">
          <PeriodSelector period={purchasesPeriod} onPeriodChange={setPurchasesPeriod} customRange={purchasesCustomRange} onCustomRangeChange={setPurchasesCustomRange} onRefresh={refreshPurchases} loading={purchasesLoading} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Invertido</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(purchasesData.totalInvested)}</div><p className="text-xs text-muted-foreground">En el período</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Compras Realizadas</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{purchasesData.totalPurchases}</div><p className="text-xs text-muted-foreground">Transacciones</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Compra Promedio</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(purchasesData.averagePurchase)}</div><p className="text-xs text-muted-foreground">Por transacción</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unidades Compradas</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{purchasesData.totalUnits}</div><p className="text-xs text-muted-foreground">Total de productos</p></CardContent></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><PurchasesOverviewChart data={purchasesData.purchasesByDay} loading={purchasesLoading} /></div>
            <div><PurchasesBySupplierChart data={purchasesData.purchasesBySupplier} loading={purchasesLoading} /></div>
          </div>
          <ProductCostsTable data={purchasesData.productCosts} loading={purchasesLoading} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportPurchasesCSV} disabled={purchasesLoading}><Download className="h-4 w-4 mr-2" />Exportar Compras CSV</Button>
          </div>
        </TabsContent>

        {/* Debt Tab */}
        <TabsContent value="debt" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(debtSummary.totalDebt)}</div><p className="text-xs text-muted-foreground">De {debtSummary.count} clientes</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clientes con Deuda</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{debtSummary.count}</div><p className="text-xs text-muted-foreground">De {allCustomers.length} totales</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Promedio de Deuda</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(debtSummary.avgDebt)}</div><p className="text-xs text-muted-foreground">Por cliente</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Alto Riesgo</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{debtSummary.highRiskCount}</div><p className="text-xs text-muted-foreground">Deuda mayor a S/ 2,000</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nombre, email o teléfono..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Nivel de deuda" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las deudas</SelectItem>
                    <SelectItem value="low">Bajo (≤ S/ 500)</SelectItem>
                    <SelectItem value="medium">Medio (S/ 500 - 2,000)</SelectItem>
                    <SelectItem value="high">Alto ({`>`} S/ 2,000)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Mayor deuda</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="recent">Más reciente</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportDebtCSV} disabled={filteredCustomers.length === 0}>
                  <Download className="h-4 w-4 mr-2" />Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Detalle de Cuentas por Cobrar</CardTitle><CardDescription>{filteredCustomers.length} cliente(s) con saldo pendiente</CardDescription></CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {customersWithDebt.length === 0 ? "No hay clientes con saldo pendiente" : "No se encontraron resultados con los filtros aplicados"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead className="text-right">Deuda</TableHead>
                      <TableHead>Última Actualización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const debtLevel = getDebtLevel(customer.balance);
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="font-medium">{customer.name}</div>
                            {customer.address && <div className="text-sm text-muted-foreground truncate max-w-[200px]">{customer.address}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {customer.email && <div>{customer.email}</div>}
                              {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={debtLevel.variant}>{debtLevel.label}</Badge></TableCell>
                          <TableCell className="text-right font-medium text-destructive">{formatCurrency(Math.abs(customer.balance))}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(customer.updated_at).toLocaleDateString('es-PE')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
