import { usePushSendLogs } from '@/hooks/useAdminNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, CheckCircle, XCircle, Users, TrendingUp, Send, Filter } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';

const TARGET_LABELS = {
  all: 'Todos',
  pro: 'PRO',
  free: 'Gratuitos',
  inactive: 'Inativos',
  user: 'Específico'
};

type PeriodFilter = 'all' | '7days' | '30days' | 'today';
type StatusFilter = 'all' | 'success' | 'failed';
type TargetFilter = 'all' | 'all_users' | 'pro' | 'free' | 'inactive' | 'user';

export function NotificationHistory() {
  const { data: logs, isLoading } = usePushSendLogs();
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter(log => {
      // Period filter
      if (periodFilter !== 'all') {
        const logDate = new Date(log.sent_at);
        const now = new Date();
        
        if (periodFilter === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (!isAfter(logDate, today)) return false;
        } else if (periodFilter === '7days') {
          if (!isAfter(logDate, subDays(now, 7))) return false;
        } else if (periodFilter === '30days') {
          if (!isAfter(logDate, subDays(now, 30))) return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const successRate = log.total_recipients > 0 
          ? (log.success_count / log.total_recipients) * 100 
          : 0;
        
        if (statusFilter === 'success' && successRate < 70) return false;
        if (statusFilter === 'failed' && successRate >= 70) return false;
      }

      // Target filter
      if (targetFilter !== 'all') {
        const targetType = targetFilter === 'all_users' ? 'all' : targetFilter;
        if (log.target_type !== targetType) return false;
      }

      return true;
    });
  }, [logs, periodFilter, statusFilter, targetFilter]);

  const stats = useMemo(() => {
    if (!filteredLogs || filteredLogs.length === 0) return null;

    const totalSent = filteredLogs.reduce((acc, log) => acc + log.success_count, 0);
    const totalFailed = filteredLogs.reduce((acc, log) => acc + log.failure_count, 0);
    const totalRecipients = filteredLogs.reduce((acc, log) => acc + log.total_recipients, 0);
    const overallSuccessRate = totalRecipients > 0 
      ? Math.round((totalSent / totalRecipients) * 100) 
      : 0;

    // Stats by target type
    const byTargetType = filteredLogs.reduce((acc, log) => {
      if (!acc[log.target_type]) {
        acc[log.target_type] = { sent: 0, failed: 0, count: 0 };
      }
      acc[log.target_type].sent += log.success_count;
      acc[log.target_type].failed += log.failure_count;
      acc[log.target_type].count += 1;
      return acc;
    }, {} as Record<string, { sent: number; failed: number; count: number }>);

    return {
      totalNotifications: filteredLogs.length,
      totalSent,
      totalFailed,
      totalRecipients,
      overallSuccessRate,
      byTargetType
    };
  }, [filteredLogs]);

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
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Alta entrega (≥70%)</SelectItem>
                <SelectItem value="failed">Baixa entrega (&lt;70%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={targetFilter} onValueChange={(v) => setTargetFilter(v as TargetFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Destinatário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="all_users">Todos os usuários</SelectItem>
                <SelectItem value="pro">PRO</SelectItem>
                <SelectItem value="free">Gratuitos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="user">Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
            {filteredLogs.length !== logs?.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredLogs.length} de {logs?.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLogs?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {logs?.length === 0 
                ? 'Nenhum envio registrado ainda' 
                : 'Nenhum resultado com os filtros selecionados'}
            </p>
          ) : (
            filteredLogs?.map((log) => {
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
