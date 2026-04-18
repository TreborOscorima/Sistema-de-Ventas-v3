import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  tax_id: string | null;
  tax_rate: number;
  tax_name: string;
  show_tax_on_receipt: boolean;
  receipt_header: string | null;
  receipt_footer: string | null;
  show_logo_on_receipt: boolean;
  thermal_paper_size: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppRole = 'owner' | 'admin' | 'cashier';

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: AppRole;
  created_at: string;
}

export const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pos', label: 'Punto de Venta' },
  { key: 'productos', label: 'Productos' },
  { key: 'categorias', label: 'Categorías' },
  { key: 'compras', label: 'Compras' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'caja', label: 'Caja' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'comprobantes', label: 'Comprobantes' },
  { key: 'configuracion', label: 'Configuración' },
] as const;

export type ModuleKey = typeof ALL_MODULES[number]['key'];

// Default modules for cashiers when no custom permissions are set
const DEFAULT_CASHIER_MODULES: ModuleKey[] = ['pos', 'caja', 'reservas'];

interface CompanyContextType {
  company: Company | null;
  branches: Branch[];
  activeBranch: Branch | null;
  userRole: AppRole | null;
  userPermissions: ModuleKey[];
  loading: boolean;
  needsOnboarding: boolean;
  hasModuleAccess: (module: ModuleKey) => boolean;
  setActiveBranch: (branch: Branch) => void;
  createCompanyAndBranch: (companyName: string, branchName: string, branchAddress?: string) => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const ACTIVE_BRANCH_KEY = 'active_branch_id';

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadCompanyData = useCallback(async () => {
    if (!user) {
      setCompany(null);
      setBranches([]);
      setActiveBranchState(null);
      setUserRole(null);
      setUserPermissions([]);
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's role (which company they belong to)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      const userRoleData = roles[0] as UserRole;
      setUserRole(userRoleData.role as AppRole);

      // Get company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userRoleData.company_id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData as Company);

      // Get branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', userRoleData.company_id)
        .eq('is_active', true)
        .order('name');

      if (branchesError) throw branchesError;
      const allBranches = (branchesData || []) as Branch[];
      setBranches(allBranches);

      // Get user's assigned branches
      const { data: branchUsers } = await supabase
        .from('branch_users')
        .select('branch_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const assignedBranchIds = branchUsers?.map(bu => bu.branch_id) || [];
      
      // Owners can see all branches, others only assigned ones
      const availableBranches = userRoleData.role === 'owner' 
        ? allBranches 
        : allBranches.filter(b => assignedBranchIds.includes(b.id));

      setBranches(availableBranches);

      // Restore active branch from localStorage or use first available
      const savedBranchId = localStorage.getItem(ACTIVE_BRANCH_KEY);
      const savedBranch = availableBranches.find(b => b.id === savedBranchId);
      
      if (savedBranch) {
        setActiveBranchState(savedBranch);
      } else if (availableBranches.length > 0) {
        setActiveBranchState(availableBranches[0]);
        localStorage.setItem(ACTIVE_BRANCH_KEY, availableBranches[0].id);
      }

      // Load user permissions for non-owner/admin roles
      if (userRoleData.role === 'owner' || userRoleData.role === 'admin') {
        setUserPermissions(ALL_MODULES.map(m => m.key));
      } else {
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('module')
          .eq('user_id', user.id)
          .eq('company_id', userRoleData.company_id);

        if (perms && perms.length > 0) {
          setUserPermissions(perms.map(p => p.module as ModuleKey));
        } else {
          // Default cashier modules if no custom permissions set
          setUserPermissions(DEFAULT_CASHIER_MODULES);
        }
      }

      setNeedsOnboarding(false);
    } catch (err) {
      console.error('Error loading company data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const hasModuleAccess = useCallback((module: ModuleKey): boolean => {
    if (!userRole) return false;
    if (userRole === 'owner' || userRole === 'admin') return true;
    return userPermissions.includes(module);
  }, [userRole, userPermissions]);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem(ACTIVE_BRANCH_KEY, branch.id);
  };

  const createCompanyAndBranch = async (companyName: string, branchName: string, branchAddress?: string) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase.rpc('onboard_company', {
      _company_name: companyName,
      _branch_name: branchName,
      _branch_address: branchAddress || null
    });

    if (error) throw error;

    // Reload
    await loadCompanyData();
  };

  return (
    <CompanyContext.Provider value={{
      company,
      branches,
      activeBranch,
      userRole,
      userPermissions,
      loading,
      needsOnboarding,
      hasModuleAccess,
      setActiveBranch,
      createCompanyAndBranch,
      refreshCompany: loadCompanyData
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
