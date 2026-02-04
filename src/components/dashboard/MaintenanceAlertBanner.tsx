import { Wrench, AlertTriangle, ChevronRight } from 'lucide-react';
import { useMaintenanceReminders } from '@/hooks/useMaintenanceReminders';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MaintenanceAlertBanner() {
  const { pendingReminders, approachingReminders, isLoading } = useMaintenanceReminders();

  if (isLoading) return null;

  const hasPending = pendingReminders.length > 0;
  const hasApproaching = approachingReminders.length > 0;

  if (!hasPending && !hasApproaching) return null;

  const mainReminder = hasPending ? pendingReminders[0] : approachingReminders[0];
  const totalAlerts = pendingReminders.length + approachingReminders.length;

  return (
    <Link to="/settings" className="block">
      <div className={cn(
        "rounded-xl p-3 border flex items-center gap-3 transition-colors",
        hasPending 
          ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15" 
          : "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15"
      )}>
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          hasPending ? "bg-amber-500/20" : "bg-blue-500/20"
        )}>
          {hasPending ? (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          ) : (
            <Wrench className="w-4 h-4 text-blue-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm truncate",
            hasPending ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {hasPending ? 'Manutenção pendente' : 'Manutenção próxima'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {mainReminder.name}
            {totalAlerts > 1 && ` +${totalAlerts - 1} outra(s)`}
          </p>
        </div>

        <ChevronRight className={cn(
          "w-4 h-4 flex-shrink-0",
          hasPending ? "text-amber-500" : "text-blue-500"
        )} />
      </div>
    </Link>
  );
}
