import { usePushSendLogs } from '@/hooks/useAdminNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TARGET_LABELS = {
  all: 'Todos',
  pro: 'PRO',
  free: 'Gratuitos',
  inactive: 'Inativos',
  user: 'Específico'
};

export function NotificationHistory() {
  const { data: logs, isLoading } = usePushSendLogs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Envios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum envio registrado ainda
          </p>
        ) : (
          logs?.map((log) => {
            const successRate = log.total_recipients > 0 
              ? Math.round((log.success_count / log.total_recipients) * 100)
              : 0;
            
            return (
              <div 
                key={log.id} 
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {TARGET_LABELS[log.target_type as keyof typeof TARGET_LABELS] || log.target_type}
                      </Badge>
                      {log.recurring_id && (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                      {log.notification_id && (
                        <Badge variant="secondary">Agendada</Badge>
                      )}
                    </div>
                    <p className="font-medium mt-2 truncate">{log.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{log.body}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      {log.success_count}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      {log.failure_count}
                    </span>
                    <span className="text-muted-foreground">
                      Taxa: {successRate}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
