import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Customer,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSales
} from '@/lib/customers';
import { createBalanceMovement } from '@/lib/customer-movements';
export function useCustomers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getCustomers(user.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    balance?: number;
  }) => {
    if (!user) return null;

    try {
      const newCustomer = await createCustomer(user.id, {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        notes: customerData.notes || null,
        balance: customerData.balance || 0
      });
      
      setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Cliente creado',
        description: `${newCustomer.name} ha sido agregado exitosamente`
      });
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el cliente',
        variant: 'destructive'
      });
      return null;
    }
  };

  const editCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const updated = await updateCustomer(customerId, updates);
      setCustomers(prev => 
        prev.map(c => c.id === customerId ? updated : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: 'Cliente actualizado',
        description: 'Los cambios han sido guardados'
      });
      return updated;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cliente',
        variant: 'destructive'
      });
      return null;
    }
  };

  const removeCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado'
      });
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente',
        variant: 'destructive'
      });
      return false;
    }
  };

  const adjustBalance = async (customerId: string, amount: number, isDebit: boolean) => {
    if (!user) return null;
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    const adjustedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = customer.balance + adjustedAmount;

    const updated = await editCustomer(customerId, { balance: newBalance });
    
    if (updated) {
      // Record the movement
      const movementType = isDebit ? 'adjustment_debit' : 'adjustment_credit';
      const description = isDebit 
        ? `Cargo manual por ${formatCurrencySimple(Math.abs(amount))}`
        : `Abono manual por ${formatCurrencySimple(Math.abs(amount))}`;
      
      try {
        await createBalanceMovement(
          user.id,
          customerId,
          movementType,
          adjustedAmount,
          newBalance,
          undefined,
          description
        );
      } catch (error) {
        console.error('Error recording balance movement:', error);
      }
    }
    
    return updated;
  };

  const formatCurrencySimple = (value: number) => {
    return `S/ ${value.toFixed(2)}`;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    loading,
    searchQuery,
    setSearchQuery,
    addCustomer,
    editCustomer,
    removeCustomer,
    adjustBalance,
    refreshCustomers: fetchCustomers,
    getCustomerSales
  };
}
