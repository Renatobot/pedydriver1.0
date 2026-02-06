import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GuestEntry, 
  addGuestEntry as addGuestEntryDB, 
  getGuestEntries as getGuestEntriesDB,
  getGuestEntriesByType,
  clearGuestData as clearGuestDataDB,
  hasGuestData as hasGuestDataDB,
  cleanupExpiredGuestData,
  getGuestEntryCount,
  deleteGuestEntry as deleteGuestEntryDB
} from '@/lib/offlineDB';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';

interface GuestModeContextValue {
  isGuest: boolean;
  guestEntries: GuestEntry[];
  addGuestEntry: (entry: Omit<GuestEntry, 'id' | 'created_at'>) => Promise<string>;
  deleteGuestEntry: (id: string) => Promise<void>;
  getGuestEarnings: () => Promise<GuestEntry[]>;
  getGuestExpenses: () => Promise<GuestEntry[]>;
  migrateToUser: (userId: string) => Promise<boolean>;
  clearGuestData: () => Promise<void>;
  refreshGuestEntries: () => Promise<void>;
  guestEntryCount: number;
  showSignupModal: boolean;
  setShowSignupModal: (show: boolean) => void;
  triggerSignupModal: (reason?: string) => void;
  signupModalReason: string;
}

const GuestModeContext = createContext<GuestModeContextValue | null>(null);

// Routes that require authentication (trigger signup modal for guests)
const PROTECTED_ROUTES = ['/history', '/reports', '/settings', '/achievements'];

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [guestEntries, setGuestEntries] = useState<GuestEntry[]>([]);
  const [guestEntryCount, setGuestEntryCount] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalReason, setSignupModalReason] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { trackDemoDataMigrated } = useAnalytics();

  // Determine if user is in guest mode (on /demo route)
  const isGuest = location.pathname === '/demo';

  // Cleanup expired guest data on mount
  useEffect(() => {
    cleanupExpiredGuestData();
  }, []);

  // Load guest entries when in guest mode
  useEffect(() => {
    if (isGuest) {
      refreshGuestEntries();
    }
  }, [isGuest]);

  const refreshGuestEntries = useCallback(async () => {
    try {
      const entries = await getGuestEntriesDB();
      setGuestEntries(entries);
      const count = await getGuestEntryCount();
      setGuestEntryCount(count);
    } catch (error) {
      console.error('Error loading guest entries:', error);
    }
  }, []);

  const addGuestEntry = useCallback(async (entry: Omit<GuestEntry, 'id' | 'created_at'>): Promise<string> => {
    const id = await addGuestEntryDB(entry);
    await refreshGuestEntries();
    return id;
  }, [refreshGuestEntries]);

  const deleteGuestEntry = useCallback(async (id: string): Promise<void> => {
    await deleteGuestEntryDB(id);
    await refreshGuestEntries();
  }, [refreshGuestEntries]);

  const getGuestEarnings = useCallback(async (): Promise<GuestEntry[]> => {
    return getGuestEntriesByType('earning');
  }, []);

  const getGuestExpenses = useCallback(async (): Promise<GuestEntry[]> => {
    return getGuestEntriesByType('expense');
  }, []);

  const triggerSignupModal = useCallback((reason?: string) => {
    setSignupModalReason(reason || 'Crie sua conta grátis para salvar seus dados');
    setShowSignupModal(true);
  }, []);

  const clearGuestData = useCallback(async () => {
    await clearGuestDataDB();
    setGuestEntries([]);
    setGuestEntryCount(0);
  }, []);

  /**
   * Migrate guest data to user account after signup
   */
  const migrateToUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const entries = await getGuestEntriesDB();
      
      if (entries.length === 0) {
        return true;
      }

      // Get default platforms to map names to IDs
      const { data: platforms } = await supabase
        .from('platforms')
        .select('id, name')
        .or(`user_id.is.null,user_id.eq.${userId}`);

      const platformMap = new Map(
        platforms?.map(p => [p.name.toLowerCase(), p.id]) || []
      );

      // Separate entries by type
      const earnings = entries.filter(e => e.type === 'earning');
      const expenses = entries.filter(e => e.type === 'expense');

      // Migrate earnings
      if (earnings.length > 0) {
        const earningsToInsert = earnings.map(entry => {
          const platformId = platformMap.get(entry.platform_name.toLowerCase()) || null;
          return {
            user_id: userId,
            amount: entry.amount,
            date: entry.date,
            platform_id: platformId,
            notes: entry.notes || `Migrado do modo visitante`,
            earning_type: 'corrida_entrega' as const,
            payment_type: 'imediato' as const,
            service_type: 'corrida' as const,
            service_count: 1,
          };
        });

        const { error: earningsError } = await supabase
          .from('earnings')
          .insert(earningsToInsert);

        if (earningsError) {
          console.error('Error migrating earnings:', earningsError);
        }
      }

      // Migrate expenses
      if (expenses.length > 0) {
        const expensesToInsert = expenses.map(entry => ({
          user_id: userId,
          amount: entry.amount,
          date: entry.date,
          category: (entry.category as 'combustivel' | 'manutencao' | 'alimentacao' | 'outros') || 'outros',
          notes: entry.notes || `Migrado do modo visitante`,
        }));

        const { error: expensesError } = await supabase
          .from('expenses')
          .insert(expensesToInsert);

        if (expensesError) {
          console.error('Error migrating expenses:', expensesError);
        }
      }

      // Clear guest data after successful migration
      await clearGuestData();
      
      // Track migration event
      trackDemoDataMigrated(entries.length);
      
      toast.success('Seus dados foram salvos! 🎉', {
        description: `${entries.length} registro(s) migrado(s) para sua conta.`,
      });

      return true;
    } catch (error) {
      console.error('Error migrating guest data:', error);
      toast.error('Erro ao migrar dados', {
        description: 'Alguns dados podem não ter sido salvos.',
      });
      return false;
    }
  }, [clearGuestData]);

  return (
    <GuestModeContext.Provider
      value={{
        isGuest,
        guestEntries,
        addGuestEntry,
        deleteGuestEntry,
        getGuestEarnings,
        getGuestExpenses,
        migrateToUser,
        clearGuestData,
        refreshGuestEntries,
        guestEntryCount,
        showSignupModal,
        setShowSignupModal,
        triggerSignupModal,
        signupModalReason,
      }}
    >
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}

// Hook to check if current route requires auth for guests
export function useGuestRouteGuard() {
  const location = useLocation();
  const { isGuest, triggerSignupModal } = useGuestMode();

  useEffect(() => {
    if (isGuest && PROTECTED_ROUTES.some(route => location.pathname.startsWith(route))) {
      triggerSignupModal('Crie sua conta para acessar esta funcionalidade');
    }
  }, [location.pathname, isGuest, triggerSignupModal]);
}
