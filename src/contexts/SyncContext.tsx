import { createContext, useContext, ReactNode } from 'react';
import { useSyncManager } from '@/hooks/useSyncManager';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;
  syncAll: () => Promise<void>;
  updatePendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const syncManager = useSyncManager();

  return (
    <SyncContext.Provider value={syncManager}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
