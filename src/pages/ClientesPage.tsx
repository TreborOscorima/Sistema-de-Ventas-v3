import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCustomers } from '@/hooks/use-customers';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { CustomerBalanceDialog } from '@/components/customers/CustomerBalanceDialog';
import { CustomerPurchaseHistory } from '@/components/customers/CustomerPurchaseHistory';
import { CustomerMovementsHistory } from '@/components/customers/CustomerMovementsHistory';
import { Customer } from '@/lib/customers';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
  ShoppingBag,
  Users,
  Loader2,
  Mail,
  Phone,
  History
} from 'lucide-react';

export default function ClientesPage() {
  const {
    customers,
    loading,
    searchQuery,
    setSearchQuery,
    addCustomer,
    editCustomer,
    removeCustomer,
    adjustBalance
  } = useCustomers();

  const [formOpen, setFormOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleBalanceClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBalanceDialogOpen(true);
  };

  const handleHistoryClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryDialogOpen(true);
  };

  const handleMovementsClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setMovementsDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      await removeCustomer(selectedCustomer.id);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    balance?: number;
  }) => {
    if (selectedCustomer) {
      return editCustomer(selectedCustomer.id, data);
    }
    return addCustomer(data);
  };

  const totalDebt = customers
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const totalCredit = customers
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus clientes y sus saldos</p>
        </div>
        <Button onClick={handleNewCustomer}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deudas por Cobrar</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldos a Favor</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCredit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No hay clientes</p>
              <p className="text-sm">Agrega tu primer cliente para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.address && (
                          <p className="text-sm text-muted-foreground">{customer.address}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        customer.balance > 0 
                          ? 'text-green-600' 
                          : customer.balance < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {formatCurrency(customer.balance)}
                      </span>
                      {customer.balance !== 0 && (
                        <p className="text-xs text-muted-foreground">
                          {customer.balance > 0 ? 'A favor' : 'Por cobrar'}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBalanceClick(customer)}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Ajustar Saldo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHistoryClick(customer)}>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Ver Compras
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMovementsClick(customer)}>
                            <History className="mr-2 h-4 w-4" />
                            Historial de Saldo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(customer)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
        onSubmit={handleFormSubmit}
      />

      {selectedCustomer && (
        <>
          <CustomerBalanceDialog
            open={balanceDialogOpen}
            onOpenChange={setBalanceDialogOpen}
            customer={selectedCustomer}
            onAdjustBalance={adjustBalance}
          />
          <CustomerPurchaseHistory
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            customer={selectedCustomer}
          />
          <CustomerMovementsHistory
            open={movementsDialogOpen}
            onOpenChange={setMovementsDialogOpen}
            customer={selectedCustomer}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
              <strong>{selectedCustomer?.name}</strong> de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
