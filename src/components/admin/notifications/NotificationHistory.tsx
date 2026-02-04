import { usePushSendLogs } from '@/hooks/useAdminNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { History, CheckCircle, XCircle, Users, TrendingUp, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

const TARGET_LABELS = {
  all: 'Todos',
  pro: 'PRO',
  free: 'Gratuitos',
  inactive: 'Inativos',
  user: 'Específico'
};

export function NotificationHistory() {
  const { data: logs, isLoading } = usePushSendLogs();

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const totalSent = logs.reduce((acc, log) => acc + log.success_count, 0);
    const totalFailed = logs.reduce((acc, log) => acc + log.failure_count, 0);
    const totalRecipients = logs.reduce((acc, log) => acc + log.total_recipients, 0);
    const overallSuccessRate = totalRecipients > 0 
      ? Math.round((totalSent / totalRecipients) * 100) 
      : 0;

    // Stats by target type
    const byTargetType = logs.reduce((acc, log) => {
      if (!acc[log.target_type]) {
        acc[log.target_type] = { sent: 0, failed: 0, count: 0 };
      }
      acc[log.target_type].sent += log.success_count;
      acc[log.target_type].failed += log.failure_count;
      acc[log.target_type].count += 1;
      return acc;
    }, {} as Record<string, { sent: number; failed: number; count: number }>);

    return {
      totalNotifications: logs.length,
      totalSent,
      totalFailed,
      totalRecipients,
      overallSuccessRate,
      byTargetType
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Notificações</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalNotifications}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Destinatários</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalRecipients.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Entregues</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.totalSent.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold">{stats.overallSuccessRate}%</p>
                <Progress value={stats.overallSuccessRate} className="flex-1 h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats by Target Type */}
      {stats && Object.keys(stats.byTargetType).length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Tipo de Destinatário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.byTargetType).map(([type, data]) => {
                const rate = (data.sent + data.failed) > 0 
                  ? Math.round((data.sent / (data.sent + data.failed)) * 100) 
                  : 0;
                return (
                  <div key={type} className="border rounded-lg p-3">
                    <Badge variant="outline" className="mb-2">
                      {TARGET_LABELS[type as keyof typeof TARGET_LABELS] || type}
                    </Badge>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envios:</span>
                        <span>{data.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entregues:</span>
                        <span className="text-green-600">{data.sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Falhas:</span>
                        <span className="text-red-600">{data.failed}</span>
                      </div>
                      <Progress value={rate} className="h-1.5 mt-2" />
                      <p className="text-xs text-center text-muted-foreground">{rate}% sucesso</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
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
                  className="border rounded-lg p-4 space-y-3"
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
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.sent_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Delivery Stats Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {log.total_recipients} destinatários
                      </span>
                      <span className={successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                        {successRate}% entregues
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-green-500 transition-all" 
                        style={{ width: `${successRate}%` }}
                      />
                      <div 
                        className="bg-red-500 transition-all" 
                        style={{ width: `${100 - successRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {log.success_count} sucesso
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3 h-3" />
                        {log.failure_count} falhas
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
