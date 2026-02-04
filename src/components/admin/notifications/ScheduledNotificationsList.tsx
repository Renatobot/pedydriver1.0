import { useScheduledNotifications, useCancelScheduled } from '@/hooks/useAdminNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', variant: 'default' as const, icon: Clock },
  sent: { label: 'Enviada', variant: 'secondary' as const, icon: CheckCircle },
  failed: { label: 'Falhou', variant: 'destructive' as const, icon: XCircle },
  cancelled: { label: 'Cancelada', variant: 'outline' as const, icon: AlertCircle },
};

const TARGET_LABELS = {
  all: 'Todos',
  pro: 'PRO',
  free: 'Gratuitos',
  inactive: 'Inativos',
  user: 'Específico'
};

export function ScheduledNotificationsList() {
  const { data: notifications, isLoading } = useScheduledNotifications();
  const cancelScheduled = useCancelScheduled();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Agendadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingNotifications = notifications?.filter(n => n.status === 'pending') || [];
  const completedNotifications = notifications?.filter(n => n.status !== 'pending') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Notificações Agendadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma notificação agendada
          </p>
        ) : (
          <>
            {pendingNotifications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Pendentes</h4>
                {pendingNotifications.map((notif) => {
                  const config = STATUS_CONFIG[notif.status as keyof typeof STATUS_CONFIG];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={notif.id} 
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={config.variant} className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                            <Badge variant="outline">
                              {TARGET_LABELS[notif.target_type as keyof typeof TARGET_LABELS]}
                            </Badge>
                          </div>
                          <p className="font-medium mt-2 truncate">{notif.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{notif.body}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelScheduled.mutate(notif.id)}
                          disabled={cancelScheduled.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Agendada para: {format(new Date(notif.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedNotifications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Concluídas</h4>
                {completedNotifications.slice(0, 10).map((notif) => {
                  const config = STATUS_CONFIG[notif.status as keyof typeof STATUS_CONFIG];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={notif.id} 
                      className="border rounded-lg p-4 space-y-2 opacity-70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={config.variant} className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                            <Badge variant="outline">
                              {TARGET_LABELS[notif.target_type as keyof typeof TARGET_LABELS]}
                            </Badge>
                            {notif.status === 'sent' && (
                              <span className="text-xs text-muted-foreground">
                                ✓ {notif.sent_count} | ✗ {notif.failed_count}
                              </span>
                            )}
                          </div>
                          <p className="font-medium mt-2 truncate">{notif.title}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notif.sent_at 
                          ? `Enviada em: ${format(new Date(notif.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          : `Agendada para: ${format(new Date(notif.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
