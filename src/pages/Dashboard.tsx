import { useState } from 'react';
import { Clock, Navigation, Banknote, Wallet, CreditCard, Hash } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfitCard } from '@/components/dashboard/ProfitCard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PlatformCard } from '@/components/dashboard/PlatformCard';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { ProfitEvolutionChart } from '@/components/dashboard/ProfitEvolutionChart';
import { PlatformComparisonChart } from '@/components/dashboard/PlatformComparisonChart';
import { ExpenseCategoryChart } from '@/components/dashboard/ExpenseCategoryChart';
import { useDashboard, DateRange } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { EntryLimitBanner } from '@/components/subscription/EntryLimitBanner';

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('day');
  const { 
    metrics, 
    platformMetrics, 
    earnings, 
    expenses, 
    isLoading,
    weekStartsOn,
    costPerKm,
  } = useDashboard(range);
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Motorista';

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto scroll-momentum">
        {/* Header */}
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-muted-foreground text-xs sm:text-sm">Olá, {firstName}!</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Seu Resumo</h1>
        </div>

        {/* Entry Limit Banner */}
        <EntryLimitBanner />

        {/* Date Range Selector */}
        <DateRangeSelector value={range} onChange={setRange} />

        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-24 sm:h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
              <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Profit Card */}
            <ProfitCard value={metrics.realProfit} />

            {/* Main Metrics */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <MetricCard
                label="Receita Total"
                value={metrics.totalRevenue}
                variant="profit"
                icon={<Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
              <MetricCard
                label="Gastos"
                value={metrics.totalExpenses}
                variant="expense"
                icon={<Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
            </div>

            {/* Payment Split */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <MetricCard
                label="Imediato"
                value={metrics.immediateRevenue}
                icon={<Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                subtitle="Dinheiro/Pix"
              />
              <MetricCard
                label="Via App"
                value={metrics.appRevenue}
                icon={<CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                subtitle="Saldo no app"
              />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MetricCard
                label="R$/hora"
                value={metrics.revenuePerHour}
                variant={metrics.revenuePerHour >= 0 ? 'profit' : 'expense'}
                icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
              <MetricCard
                label="R$/km"
                value={metrics.revenuePerKm}
                variant={metrics.revenuePerKm >= 0 ? 'profit' : 'expense'}
                icon={<Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
              <MetricCard
                label="Serviços"
                value={metrics.totalServices}
                format="number"
                icon={<Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
            </div>

            {/* Work Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <MetricCard
                label="Horas"
                value={metrics.totalHours}
                format="hours"
                icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
              <MetricCard
                label="Km"
                value={metrics.totalKm}
                format="km"
                icon={<Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              />
            </div>

            {/* Charts Section - PRO Feature */}
            <FeatureGate feature="advancedCharts" showTeaser>
              <div className="space-y-3 sm:space-y-4">
                <ProfitEvolutionChart
                  earnings={earnings}
                  expenses={expenses}
                  range={range}
                  weekStartsOn={weekStartsOn as 0 | 1}
                  costPerKm={costPerKm}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <PlatformComparisonChart platformMetrics={platformMetrics} />
                  <ExpenseCategoryChart expenses={expenses} />
                </div>
              </div>
            </FeatureGate>

            {/* Platform Comparison */}
            {platformMetrics.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Por Plataforma
                </h2>
                <div className="space-y-2 sm:space-y-3">
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
