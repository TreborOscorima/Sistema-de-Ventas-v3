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

interface CompanyContextType {
  company: Company | null;
  branches: Branch[];
  activeBranch: Branch | null;
  userRole: AppRole | null;
  loading: boolean;
  needsOnboarding: boolean;
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
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadCompanyData = useCallback(async () => {
    if (!user) {
      setCompany(null);
      setBranches([]);
      setActiveBranchState(null);
      setUserRole(null);
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

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem(ACTIVE_BRANCH_KEY, branch.id);
  };

  const createCompanyAndBranch = async (companyName: string, branchName: string, branchAddress?: string) => {
    if (!user) throw new Error('No user logged in');

    // 1. Create company
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single();

    if (companyError) throw companyError;

    // 2. Assign owner role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        company_id: newCompany.id,
        role: 'owner'
      });

    if (roleError) throw roleError;

    // 3. Create first branch
    const { data: newBranch, error: branchError } = await supabase
      .from('branches')
      .insert({
        company_id: newCompany.id,
        name: branchName,
        address: branchAddress || null
      })
      .select()
      .single();

    if (branchError) throw branchError;

    // 4. Assign owner to the branch
    const { error: branchUserError } = await supabase
      .from('branch_users')
      .insert({
        user_id: user.id,
        branch_id: newBranch.id
      });

    if (branchUserError) throw branchUserError;

    // Reload
    await loadCompanyData();
  };

  return (
    <CompanyContext.Provider value={{
      company,
      branches,
      activeBranch,
      userRole,
      loading,
      needsOnboarding,
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
