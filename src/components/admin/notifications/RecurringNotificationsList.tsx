import { useRecurringNotifications, useToggleRecurring, useDeleteRecurring } from '@/hooks/useAdminNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Repeat, MoreVertical, Trash2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FREQUENCY_LABELS = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal'
};

const TARGET_LABELS = {
  all: 'Todos',
  pro: 'PRO',
  free: 'Gratuitos',
  inactive: 'Inativos'
};

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getScheduleDescription(notif: {
  frequency: string;
  time_of_day: string;
  days_of_week: number[];
  day_of_month: number | null;
}) {
  const time = notif.time_of_day.slice(0, 5);
  
  if (notif.frequency === 'daily') {
    return `Todos os dias às ${time}`;
  }
  
  if (notif.frequency === 'weekly') {
    const days = notif.days_of_week.map(d => DAYS_SHORT[d]).join(', ');
    return `${days} às ${time}`;
  }
  
  if (notif.frequency === 'monthly') {
    return `Dia ${notif.day_of_month} de cada mês às ${time}`;
  }
  
  return '';
}

export function RecurringNotificationsList() {
  const { data: notifications, isLoading } = useRecurringNotifications();
  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Recorrentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Notificações Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma notificação recorrente configurada
          </p>
        ) : (
          notifications?.map((notif) => (
            <div 
              key={notif.id} 
              className={`border rounded-lg p-4 space-y-3 ${!notif.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={notif.is_active ? 'default' : 'secondary'}>
                      {notif.is_active ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <Badge variant="outline">
                      {FREQUENCY_LABELS[notif.frequency as keyof typeof FREQUENCY_LABELS]}
                    </Badge>
                    <Badge variant="outline">
                      {TARGET_LABELS[notif.target_type as keyof typeof TARGET_LABELS]}
                    </Badge>
                  </div>
                  <p className="font-medium mt-2">{notif.name}</p>
                  <p className="text-sm text-muted-foreground">{notif.title}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={notif.is_active}
                    onCheckedChange={(checked) => toggleRecurring.mutate({ id: notif.id, isActive: checked })}
                    disabled={toggleRecurring.isPending}
                  />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteRecurring.mutate(notif.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>📅 {getScheduleDescription(notif)}</p>
                <p>
                  ⏰ Próximo envio: {notif.is_active 
                    ? format(new Date(notif.next_run_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                    : 'Pausado'
                  }
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Total enviados: {notif.total_sent}
                </span>
                {notif.last_run_at && (
                  <span>
                    Última execução: {format(new Date(notif.last_run_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
