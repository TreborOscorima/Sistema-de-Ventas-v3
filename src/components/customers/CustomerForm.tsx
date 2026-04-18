import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/lib/customers';
import {
  IDENTITY_DOC_LABELS,
  AR_IVA_LABELS,
  validateIdentityDoc,
  type IdentityDocType,
  type ArIvaCondition,
} from '@/lib/fiscal';
import { useFiscalSettings } from '@/hooks/use-fiscal-settings';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    balance?: number;
    doc_type?: IdentityDocType | null;
    doc_number?: string | null;
    legal_name?: string | null;
    fiscal_email?: string | null;
    ar_iva_condition?: ArIvaCondition | null;
  }) => Promise<Customer | null>;
}

export function CustomerForm({ open, onOpenChange, customer, onSubmit }: CustomerFormProps) {
  const { data: fiscal } = useFiscalSettings();
  const country = fiscal?.country || 'PE';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [balance, setBalance] = useState('0');

  const [docType, setDocType] = useState<IdentityDocType | ''>('');
  const [docNumber, setDocNumber] = useState('');
  const [legalName, setLegalName] = useState('');
  const [fiscalEmail, setFiscalEmail] = useState('');
  const [arIva, setArIva] = useState<ArIvaCondition | ''>('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
      setBalance(customer.balance.toString());
      setDocType((customer.doc_type as IdentityDocType) || '');
      setDocNumber(customer.doc_number || '');
      setLegalName(customer.legal_name || '');
      setFiscalEmail(customer.fiscal_email || '');
      setArIva((customer.ar_iva_condition as ArIvaCondition) || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setBalance('0');
      setDocType('');
      setDocNumber('');
      setLegalName('');
      setFiscalEmail('');
      setArIva('');
    }
  }, [customer, open]);

  const docOptions: IdentityDocType[] =
    country === 'PE'
      ? ['pe_dni', 'pe_ruc', 'pe_ce', 'pe_pasaporte', 'pe_sin_doc']
      : ['ar_dni', 'ar_cuit', 'ar_cuil', 'ar_pasaporte', 'ar_cf'];

  const docValid = !docType || !docNumber
    ? true
    : validateIdentityDoc(docType, docNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (docType && docNumber && !docValid) return;

    setLoading(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        balance: parseFloat(balance) || 0,
        doc_type: docType || null,
        doc_number: docNumber.trim() || null,
        legal_name: legalName.trim() || null,
        fiscal_email: fiscalEmail.trim() || null,
        ar_iva_condition: country === 'AR' ? (arIva || null) : null,
      });

      if (result) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fiscal">Datos fiscales</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 999 999 999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>

              {!customer && (
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo inicial</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Positivo = a favor del cliente, Negativo = deuda del cliente
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Datos requeridos para emitir comprobantes electrónicos en {country === 'PE' ? 'Perú (SUNAT)' : 'Argentina (AFIP)'}.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select
                    value={docType}
                    onValueChange={(v) => setDocType(v as IdentityDocType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {docOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {IDENTITY_DOC_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número documento</Label>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="..."
                    className={!docValid ? 'border-destructive' : ''}
                  />
                  {!docValid && (
                    <p className="text-xs text-destructive">Documento inválido</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Razón social / Nombre legal</Label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Nombre legal según documento"
                />
              </div>

              <div className="space-y-2">
                <Label>Email fiscal</Label>
                <Input
                  type="email"
                  value={fiscalEmail}
                  onChange={(e) => setFiscalEmail(e.target.value)}
                  placeholder="Para envío de comprobantes"
                />
              </div>

              {country === 'AR' && (
                <div className="space-y-2">
                  <Label>Condición IVA</Label>
                  <Select
                    value={arIva}
                    onValueChange={(v) => setArIva(v as ArIvaCondition)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AR_IVA_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !docValid}>
              {loading ? 'Guardando...' : customer ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
