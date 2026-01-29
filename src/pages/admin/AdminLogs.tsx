import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminLogs } from '@/hooks/useAdmin';
import { FileText, Crown, Ban, RefreshCw, UserCheck, UserX, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  update_subscription: {
    label: 'Atualização de Plano',
    icon: <Crown className="w-3 h-3" />,
    variant: 'default',
  },
  block_user: {
    label: 'Usuário Bloqueado',
    icon: <UserX className="w-3 h-3" />,
    variant: 'destructive',
  },
  unblock_user: {
    label: 'Usuário Desbloqueado',
    icon: <UserCheck className="w-3 h-3" />,
    variant: 'outline',
  },
  reset_monthly_limit: {
    label: 'Limite Resetado',
    icon: <RefreshCw className="w-3 h-3" />,
    variant: 'secondary',
  },
};

export default function AdminLogs() {
  const { data: logs, isLoading } = useAdminLogs(200);

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_CONFIG[action] || {
      label: action,
      icon: <Settings className="w-3 h-3" />,
      variant: 'secondary' as const,
    };

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return '-';
    
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';

    return (
      <div className="text-xs text-muted-foreground space-y-0.5">
        {entries.map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {String(value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground">Histórico de ações administrativas</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Últimas Ações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log registrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário Afetado</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-mono">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.admin_email || '-'}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target_user_email || '-'}
                      </TableCell>
                      <TableCell>
                        {formatDetails(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
