import { useState, useCallback } from 'react';
import { Clock, Navigation, Banknote, Wallet, CreditCard, Hash, Play, Info, Layers } from 'lucide-react';
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
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { ActiveShiftBanner } from '@/components/shifts/ActiveShiftBanner';
import { StartShiftModal } from '@/components/shifts/StartShiftModal';
import { GamificationCard } from '@/components/gamification/GamificationCard';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { useActiveShift } from '@/hooks/useActiveShift';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import logoWebp from '@/assets/logo-optimized.webp';

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('day');
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const { 
    metrics, 
    platformMetrics, 
    earnings, 
    expenses, 
    isLoading,
    weekStartsOn,
    costPerKm,
    refetch,
    hasMultiPlatformShifts,
  } = useDashboard(range);
  const { user } = useAuth();
  const { hasActiveShift } = useActiveShift();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Motorista';

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <>
      {/* Onboarding Tutorial for new users */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={completeOnboarding} />
      )}

      <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto scroll-momentum">
          {/* Header with Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src={logoWebp} 
              alt="PEDY Driver" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-md"
              width={56}
              height={56}
              loading="eager"
            />
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-muted-foreground text-xs sm:text-sm">Olá, {firstName}!</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Seu Resumo</h1>
            </div>
          </div>

          {/* Active Shift Banner or Start Shift Button */}
          {hasActiveShift ? (
            <ActiveShiftBanner />
          ) : (
            <Button
              onClick={() => setShowStartShiftModal(true)}
              variant="outline"
              className="w-full h-12 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Turno
            </Button>
          )}

          {/* PWA Install Banner */}
          <PWAInstallBanner />

          {/* Entry Limit Banner */}
          <EntryLimitBanner />

          {/* Gamification Card */}
          <GamificationCard />

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
              <ProfitCard 
                value={metrics.realProfit} 
                secondaryValue={metrics.totalRevenue}
              />

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

              {/* Performance Metrics - Bruto vs Líquido */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <MetricCard
                  label="R$/hora"
                  value={metrics.revenuePerHour}
                  secondaryValue={metrics.grossRevenuePerHour}
                  variant={metrics.revenuePerHour >= 0 ? 'profit' : 'expense'}
                  icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                />
                <MetricCard
                  label="R$/km"
                  value={metrics.revenuePerKm}
                  secondaryValue={metrics.grossRevenuePerKm}
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">
                      Por Plataforma
                    </h2>
                    {hasMultiPlatformShifts && (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Layers className="w-4 h-4" />
                        <span className="text-2xs font-medium">Multi-plat.</span>
                      </div>
                    )}
                  </div>
                  
                  {hasMultiPlatformShifts && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-primary">
                        Horas e KMs são distribuídos proporcionalmente pela receita de cada plataforma. 
                        Quem gerou mais receita, provavelmente consumiu mais tempo e quilômetros.
                      </p>
                    </div>
                  )}
                  
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
      </PullToRefresh>

      {/* Start Shift Modal */}
      <StartShiftModal 
        open={showStartShiftModal} 
        onOpenChange={setShowStartShiftModal} 
      />
    </AppLayout>
    </>
  );
}
