import { useState } from 'react';
import { Bell, UserPlus, Crown, AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminAlerts, useUnreadAlertsCount, useMarkAlertAsRead, useMarkAllAlertsAsRead, AdminAlert } from '@/hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EVENT_CONFIG: Record<AdminAlert['event_type'], { label: string; icon: React.ReactNode; color: string }> = {
  new_user_free: {
    label: 'Novo Usuário',
    icon: <UserPlus className="w-4 h-4" />,
    color: 'text-blue-500',
  },
  new_user_pro: {
    label: 'Novo PRO',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-yellow-500',
  },
  payment_failure: {
    label: 'Falha Pagamento',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-500',
  },
  plan_activation_error: {
    label: 'Erro Ativação',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-orange-500',
  },
};

export function AdminAlertsBell() {
  const [open, setOpen] = useState(false);
  const { data: alerts = [] } = useAdminAlerts(20);
  const { data: unreadCount = 0 } = useUnreadAlertsCount();
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();

  const handleMarkAsRead = (alertId: string) => {
    markAsRead.mutate(alertId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold">Alertas</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todos
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum alerta</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.map((alert) => {
                const config = EVENT_CONFIG[alert.event_type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 hover:bg-accent/50 transition-colors',
                      !alert.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5', config.color)}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                          {!alert.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm mt-1 truncate">
                          {alert.user_name || alert.user_email || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(alert.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleMarkAsRead(alert.id)}
                          disabled={markAsRead.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
