import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminMetrics, useGenerateChurnAlerts } from '@/hooks/useAdmin';
import { useAdminPush } from '@/hooks/useAdminPush';
import { Users, UserCheck, Crown, UserPlus, TrendingUp, AlertTriangle, Ban, RefreshCw, Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  description?: string;
  isLoading: boolean;
}

function MetricCard({ title, value, icon, description, isLoading }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useAdminMetrics();
  const generateChurnAlerts = useGenerateChurnAlerts();
  const { isSupported, isSubscribed, isLoading: isPushLoading, toggle } = useAdminPush();

  const conversionRate = metrics 
    ? ((metrics.pro_users / (metrics.total_users || 1)) * 100).toFixed(1)
    : '0.0';

  const handleCheckChurn = () => {
    generateChurnAlerts.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isSupported && (
              <Button
                variant={isSubscribed ? "default" : "outline"}
                size="sm"
                onClick={toggle}
                disabled={isPushLoading}
                className="gap-2 w-full sm:w-auto"
              >
                {isSubscribed ? (
                  <>
                    <Bell className="h-4 w-4" />
                    Push Ativo
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    Ativar Push
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckChurn}
              disabled={generateChurnAlerts.isPending}
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${generateChurnAlerts.isPending ? 'animate-spin' : ''}`} />
              Verificar Churn
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Usuários"
            value={metrics?.total_users}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Ativos Hoje"
            value={metrics?.active_today}
            icon={<UserCheck className="h-5 w-5 text-green-500" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Usuários PRO"
            value={metrics?.pro_users}
            icon={<Crown className="h-5 w-5 text-yellow-500" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Novos Hoje"
            value={metrics?.new_today}
            icon={<UserPlus className="h-5 w-5 text-blue-500" />}
            isLoading={isLoading}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Novos na Semana"
            value={metrics?.new_week}
            icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Usuários Grátis"
            value={metrics?.free_users}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="PRO Expirados"
            value={metrics?.expired_pro}
            icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Bloqueados"
            value={metrics?.blocked_users}
            icon={<Ban className="h-5 w-5 text-red-500" />}
            isLoading={isLoading}
          />
        </div>

        {/* Conversion Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <>
                  <span className="text-4xl font-bold text-primary">{conversionRate}%</span>
                  <span className="text-muted-foreground">de usuários no plano PRO</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {metrics?.pro_users ?? 0} PRO de {metrics?.total_users ?? 0} usuários totais
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
