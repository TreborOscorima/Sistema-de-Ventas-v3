import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCashbox } from '@/hooks/use-cashbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  DollarSign, 
  History,
  FileText,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  RotateCcw,
  Calculator,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { CashboxMovement } from '@/lib/cashbox';

const movementTypeLabels: Record<CashboxMovement['type'], string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  sale: 'Venta',
  refund: 'Devolución',
  adjustment: 'Ajuste'
};

const movementTypeIcons: Record<CashboxMovement['type'], React.ReactNode> = {
  income: <ArrowUpCircle className="h-4 w-4 text-success" />,
  expense: <ArrowDownCircle className="h-4 w-4 text-destructive" />,
  sale: <ShoppingCart className="h-4 w-4 text-primary" />,
  refund: <RotateCcw className="h-4 w-4 text-warning" />,
  adjustment: <Calculator className="h-4 w-4 text-info" />
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
  other: 'Otro'
};

export default function CajaPage() {
  const { 
    activeSession, 
    movements, 
    sessionHistory, 
    loading, 
    totals,
    openSession, 
    closeSession, 
    addMovement 
  } = useCashbox();

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  
  const [movementType, setMovementType] = useState<CashboxMovement['type']>('income');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementPaymentMethod, setMovementPaymentMethod] = useState<CashboxMovement['payment_method']>('cash');

  const handleOpenSession = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return;
    await openSession(amount);
    setOpeningAmount('');
    setOpenDialogOpen(false);
  };

  const handleCloseSession = async () => {
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) return;
    await closeSession(amount, closingNotes);
    setClosingAmount('');
    setClosingNotes('');
    setCloseDialogOpen(false);
  };

  const handleAddMovement = async () => {
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0 || !movementDescription.trim()) return;
    await addMovement(movementType, amount, movementDescription.trim(), movementPaymentMethod);
    setMovementAmount('');
    setMovementDescription('');
    setMovementDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Caja</h1>
        <p className="page-subtitle">Gestión de apertura, cierre y movimientos de caja</p>
      </div>

      {/* Session Status Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Estado de Caja
              </CardTitle>
              <CardDescription>
                {activeSession ? 'Sesión activa' : 'No hay sesión activa'}
              </CardDescription>
            </div>
            <Badge className={activeSession ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
              {activeSession ? 'Abierta' : 'Cerrada'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeSession ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monto Inicial</p>
                    <p className="text-lg font-semibold">S/ {Number(activeSession.opening_amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 p-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ventas</p>
                    <p className="text-lg font-semibold text-success">S/ {totals?.totalSales.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-info/10 p-2">
                    <Wallet className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Efectivo Esperado</p>
                    <p className="text-lg font-semibold">S/ {totals?.expectedCash.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Abierta desde</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(activeSession.opened_at), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No hay una sesión de caja activa</p>
              <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 btn-gradient">
                    <Plus className="mr-2 h-4 w-4" />
                    Abrir Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                    <DialogDescription>
                      Ingresa el monto inicial para comenzar la sesión
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="opening-amount">Monto inicial (S/)</Label>
                      <Input
                        id="opening-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={openingAmount}
                        onChange={(e) => setOpeningAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleOpenSession} className="btn-gradient">
                      Abrir Caja
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeSession && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Movimiento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Movimiento</DialogTitle>
                    <DialogDescription>
                      Registra un ingreso o egreso de caja
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tipo de Movimiento</Label>
                      <Select value={movementType} onValueChange={(v) => setMovementType(v as CashboxMovement['type'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Ingreso</SelectItem>
                          <SelectItem value="expense">Egreso</SelectItem>
                          <SelectItem value="adjustment">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="movement-amount">Monto (S/)</Label>
                      <Input
                        id="movement-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={movementAmount}
                        onChange={(e) => setMovementAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <Select value={movementPaymentMethod || 'cash'} onValueChange={(v) => setMovementPaymentMethod(v as CashboxMovement['payment_method'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="yape">Yape</SelectItem>
                          <SelectItem value="plin">Plin</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="movement-description">Descripción</Label>
                      <Textarea
                        id="movement-description"
                        placeholder="Descripción del movimiento"
                        value={movementDescription}
                        onChange={(e) => setMovementDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddMovement} className="btn-gradient">
                      Registrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Minus className="mr-2 h-4 w-4" />
                    Cerrar Caja
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cerrar Caja</DialogTitle>
                    <DialogDescription>
                      Realiza el arqueo de caja para cerrar la sesión
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efectivo esperado:</span>
                        <span className="font-semibold">S/ {totals?.expectedCash.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closing-amount">Efectivo contado (S/)</Label>
                      <Input
                        id="closing-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={closingAmount}
                        onChange={(e) => setClosingAmount(e.target.value)}
                      />
                    </div>
                    {closingAmount && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Diferencia:</span>
                          <span className={`font-semibold ${
                            parseFloat(closingAmount) - (totals?.expectedCash || 0) >= 0 
                              ? 'text-success' 
                              : 'text-destructive'
                          }`}>
                            S/ {(parseFloat(closingAmount) - (totals?.expectedCash || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="closing-notes">Notas (opcional)</Label>
                      <Textarea
                        id="closing-notes"
                        placeholder="Observaciones del cierre..."
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleCloseSession}>
                      Confirmar Cierre
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Movements and History */}
      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements" className="gap-2">
            <FileText className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Movimientos de la Sesión</CardTitle>
              <CardDescription>
                {activeSession 
                  ? `Movimientos desde ${format(new Date(activeSession.opened_at), "d 'de' MMMM, HH:mm", { locale: es })}`
                  : 'No hay sesión activa'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => (
                        <TableRow key={movement.id} className="table-row-hover">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {movementTypeIcons[movement.type]}
                              <span>{movementTypeLabels[movement.type]}</span>
                            </div>
                          </TableCell>
                          <TableCell>{movement.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {movement.payment_method ? paymentMethodLabels[movement.payment_method] : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            movement.type === 'expense' || movement.type === 'refund'
                              ? 'text-destructive'
                              : 'text-success'
                          }`}>
                            {movement.type === 'expense' || movement.type === 'refund' ? '-' : '+'}
                            S/ {Number(movement.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(movement.created_at), 'HH:mm', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No hay movimientos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Historial de Sesiones</CardTitle>
              <CardDescription>Últimas sesiones de caja</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Inicial</TableHead>
                        <TableHead className="text-right">Final</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionHistory.map((session) => (
                        <TableRow key={session.id} className="table-row-hover">
                          <TableCell>
                            {session.status === 'open' ? (
                              <Badge className="bg-success/10 text-success">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Abierta
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="mr-1 h-3 w-3" />
                                Cerrada
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(session.opened_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            S/ {Number(session.opening_amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {session.closing_amount 
                              ? `S/ ${Number(session.closing_amount).toFixed(2)}` 
                              : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            session.difference 
                              ? Number(session.difference) >= 0 
                                ? 'text-success' 
                                : 'text-destructive'
                              : ''
                          }`}>
                            {session.difference 
                              ? `S/ ${Number(session.difference).toFixed(2)}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {session.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No hay sesiones anteriores</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
