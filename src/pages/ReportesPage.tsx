import { useState, useMemo } from 'react';
import { useSalesReports } from '@/hooks/use-sales-reports';
import { useCustomers } from '@/hooks/use-customers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Users, DollarSign, AlertTriangle, Download, Search, Filter, BarChart3, TrendingUp } from 'lucide-react';

import { ReportsSummaryCards } from '@/components/reports/ReportsSummaryCards';
import { SalesOverviewChart } from '@/components/reports/SalesOverviewChart';
import { PaymentMethodsChart } from '@/components/reports/PaymentMethodsChart';
import { TopProductsTable } from '@/components/reports/TopProductsTable';
import { HourlySalesChart } from '@/components/reports/HourlySalesChart';
import { PeriodSelector } from '@/components/reports/PeriodSelector';

export default function ReportesPage() {
  const {
    reportData,
    loading: salesLoading,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    refresh
  } = useSalesReports();

  const { allCustomers, loading: customersLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('balance');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  // Filter customers with negative balance (they owe money)
  const customersWithDebt = useMemo(() => {
    return allCustomers.filter(customer => customer.balance < 0);
  }, [allCustomers]);

  // Apply filters and sorting
  const filteredCustomers = useMemo(() => {
    let filtered = customersWithDebt.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);

      if (!matchesSearch) return false;

      const debtAmount = Math.abs(customer.balance);
      switch (balanceFilter) {
        case 'low':
          return debtAmount <= 500;
        case 'medium':
          return debtAmount > 500 && debtAmount <= 2000;
        case 'high':
          return debtAmount > 2000;
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return a.balance - b.balance;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customersWithDebt, searchQuery, balanceFilter, sortBy]);

  // Summary statistics for debt
  const debtSummary = useMemo(() => {
    const totalDebt = customersWithDebt.reduce((sum, c) => sum + Math.abs(c.balance), 0);
    const avgDebt = customersWithDebt.length > 0 ? totalDebt / customersWithDebt.length : 0;
    const maxDebt = customersWithDebt.length > 0 
      ? Math.max(...customersWithDebt.map(c => Math.abs(c.balance))) 
      : 0;
    const highRiskCount = customersWithDebt.filter(c => Math.abs(c.balance) > 2000).length;

    return { totalDebt, avgDebt, maxDebt, highRiskCount, count: customersWithDebt.length };
  }, [customersWithDebt]);

  const exportSalesCSV = () => {
    const headers = ['Fecha', 'Ventas', 'Transacciones'];
    const rows = reportData.salesByDay.map(d => [d.date, d.sales.toFixed(2), d.transactions.toString()]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportDebtCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Deuda', 'Última Actualización'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email || '',
      c.phone || '',
      Math.abs(c.balance).toFixed(2),
      new Date(c.updated_at).toLocaleDateString('es-PE')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cuentas_por_cobrar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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
        <p className="page-subtitle">Análisis de ventas, productos y cuentas por cobrar</p>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="sales" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="debt" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Cuentas por Cobrar</span>
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            onRefresh={refresh}
            loading={salesLoading}
          />

          <ReportsSummaryCards
            totalSales={reportData.totalSales}
            totalTransactions={reportData.totalTransactions}
            averageTicket={reportData.averageTicket}
            totalProducts={reportData.totalProducts}
            cancelledSales={reportData.cancelledSales}
            loading={salesLoading}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SalesOverviewChart data={reportData.salesByDay} loading={salesLoading} />
            </div>
            <div>
              <PaymentMethodsChart data={reportData.salesByPaymentMethod} loading={salesLoading} />
            </div>
          </div>

          <HourlySalesChart data={reportData.salesByHour} loading={salesLoading} />

          <div className="flex justify-end">
            <Button variant="outline" onClick={exportSalesCSV} disabled={salesLoading}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte CSV
            </Button>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            onRefresh={refresh}
            loading={salesLoading}
          />

          <TopProductsTable data={reportData.topProducts} loading={salesLoading} />
        </TabsContent>

        {/* Debt Tab */}
        <TabsContent value="debt" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(debtSummary.totalDebt)}
                </div>
                <p className="text-xs text-muted-foreground">
                  De {debtSummary.count} clientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes con Deuda</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debtSummary.count}</div>
                <p className="text-xs text-muted-foreground">
                  De {allCustomers.length} totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio de Deuda</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(debtSummary.avgDebt)}</div>
                <p className="text-xs text-muted-foreground">Por cliente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alto Riesgo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{debtSummary.highRiskCount}</div>
                <p className="text-xs text-muted-foreground">Deuda mayor a S/ 2,000</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email o teléfono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Nivel de deuda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las deudas</SelectItem>
                    <SelectItem value="low">Bajo (≤ S/ 500)</SelectItem>
                    <SelectItem value="medium">Medio (S/ 500 - 2,000)</SelectItem>
                    <SelectItem value="high">Alto ({`>`} S/ 2,000)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Mayor deuda</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="recent">Más reciente</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportDebtCSV} disabled={filteredCustomers.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Cuentas por Cobrar</CardTitle>
              <CardDescription>
                {filteredCustomers.length} cliente(s) con saldo pendiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {customersWithDebt.length === 0 
                    ? "No hay clientes con saldo pendiente" 
                    : "No se encontraron resultados con los filtros aplicados"}
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
                            {customer.address && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {customer.address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {customer.email && <div>{customer.email}</div>}
                              {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={debtLevel.variant}>{debtLevel.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(Math.abs(customer.balance))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(customer.updated_at).toLocaleDateString('es-PE')}
                          </TableCell>
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
