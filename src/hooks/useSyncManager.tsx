import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  getPendingOperations,
  removePendingOperation,
  getPendingCount,
  type PendingOperation,
} from '@/lib/offlineDB';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export function useSyncManager() {
  const { user } = useAuth();
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncError: null,
  });

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setSyncStatus(prev => ({ ...prev, pendingCount: count }));
  }, []);

  // Sync a single operation
  const syncOperation = async (operation: PendingOperation): Promise<boolean> => {
    try {
      const { type, table, data } = operation;

      switch (type) {
        case 'create': {
          const insertData: Record<string, unknown> = { ...data, user_id: user?.id };
          delete insertData.id; // Remove temp ID
          delete insertData.platform; // Remove joined data
          
          const { error } = await supabase.from(table).insert(insertData as never);
          if (error) throw error;
          break;
        }
        case 'update': {
          const updateData: Record<string, unknown> = { ...data };
          const recordId = data.id as string;
          delete updateData.id;
          delete updateData.platform; // Remove joined data
          
          const { error } = await supabase.from(table).update(updateData as never).eq('id', recordId);
          if (error) throw error;
          break;
        }
        case 'delete': {
          const recordId = data.id as string;
          const { error } = await supabase.from(table).delete().eq('id', recordId);
          if (error) throw error;
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Sync operation failed:', error);
      return false;
    }
  };

  // Sync all pending operations
  const syncAll = useCallback(async () => {
    if (!user || !isOnline || syncInProgress.current) return;

    syncInProgress.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const operations = await getPendingOperations();
      
      if (operations.length === 0) {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSyncAt: new Date(),
          pendingCount: 0,
        }));
        syncInProgress.current = false;
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Process operations in order
      for (const operation of operations) {
        const success = await syncOperation(operation);
        if (success) {
          await removePendingOperation(operation.id);
          successCount++;
        } else {
          failCount++;
        }
      }

      // Refresh data from server
      await queryClient.invalidateQueries({ queryKey: ['earnings'] });
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const remainingCount = await getPendingCount();

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingCount: remainingCount,
        syncError: failCount > 0 ? `${failCount} operação(ões) falharam` : null,
      }));

      if (successCount > 0) {
        toast({
          title: 'Sincronizado!',
          description: `${successCount} lançamento(s) sincronizado(s) com sucesso.`,
        });
      }

      if (failCount > 0) {
        toast({
          title: 'Erro na sincronização',
          description: `${failCount} operação(ões) não puderam ser sincronizadas.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncError: 'Erro ao sincronizar',
      }));
    }

    syncInProgress.current = false;
  }, [user, isOnline, queryClient]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && user) {
      clearWasOffline();
      syncAll();
    }
  }, [isOnline, wasOffline, user, syncAll, clearWasOffline]);

  // Update pending count on mount and periodically
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    ...syncStatus,
    isOnline,
    syncAll,
    updatePendingCount,
  };
}
