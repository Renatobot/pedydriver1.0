import { useState } from 'react';
import { Clock, Navigation, Banknote, Wallet, CreditCard, Hash } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfitCard } from '@/components/dashboard/ProfitCard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PlatformCard } from '@/components/dashboard/PlatformCard';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { useDashboard, DateRange } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('week');
  const { metrics, platformMetrics, isLoading } = useDashboard(range);
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Motorista';

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Olá, {firstName}!</p>
          <h1 className="text-2xl font-bold text-foreground">Seu Resumo</h1>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector value={range} onChange={setRange} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Profit Card */}
            <ProfitCard value={metrics.realProfit} />

            {/* Main Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Receita Total"
                value={metrics.totalRevenue}
                variant="profit"
                icon={<Banknote className="w-4 h-4" />}
              />
              <MetricCard
                label="Gastos"
                value={metrics.totalExpenses}
                variant="expense"
                icon={<Wallet className="w-4 h-4" />}
              />
            </div>

            {/* Payment Split */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Imediato"
                value={metrics.immediateRevenue}
                icon={<Banknote className="w-4 h-4" />}
                subtitle="Dinheiro/Pix"
              />
              <MetricCard
                label="Via App"
                value={metrics.appRevenue}
                icon={<CreditCard className="w-4 h-4" />}
                subtitle="Saldo no app"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="R$/hora"
                value={metrics.revenuePerHour}
                variant={metrics.revenuePerHour >= 0 ? 'profit' : 'expense'}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                label="R$/km"
                value={metrics.revenuePerKm}
                variant={metrics.revenuePerKm >= 0 ? 'profit' : 'expense'}
                icon={<Navigation className="w-4 h-4" />}
              />
              <MetricCard
                label="Serviços"
                value={metrics.totalServices}
                format="number"
                icon={<Hash className="w-4 h-4" />}
              />
            </div>

            {/* Work Stats */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Horas"
                value={metrics.totalHours}
                format="hours"
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                label="Km Rodados"
                value={metrics.totalKm}
                format="km"
                icon={<Navigation className="w-4 h-4" />}
              />
            </div>

            {/* Platform Comparison */}
            {platformMetrics.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Por Plataforma
                </h2>
                <div className="space-y-3">
                  {platformMetrics.map((pm, index) => (
                    <PlatformCard key={pm.platform.id} data={pm} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
