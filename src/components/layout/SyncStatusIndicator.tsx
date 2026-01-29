import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useSyncManager } from '@/hooks/useSyncManager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, syncAll } = useSyncManager();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null; // Don't show anything when all is synced
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg",
          isOnline 
            ? "bg-primary/10 text-primary border border-primary/20" 
            : "bg-destructive/10 text-destructive border border-destructive/20"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
            {pendingCount > 0 && (
              <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Sincronizando...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="w-4 h-4" />
            <span>{pendingCount} pendente(s)</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 ml-1"
              onClick={() => syncAll()}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
