import { useState } from 'react';
import { TrendingUp, TrendingDown, Fuel, Wrench, UtensilsCrossed, Clock, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { useDashboard, DateRange } from '@/hooks/useDashboard';
import { useExpenses } from '@/hooks/useExpenses';
import { useEarnings } from '@/hooks/useEarnings';
import { useShifts } from '@/hooks/useShifts';
import { formatCurrency } from '@/lib/formatters';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { useUserSettings } from '@/hooks/useUserSettings';
import { BestTimesAnalysis } from '@/components/reports/BestTimesAnalysis';
import { FuelEfficiencyChart } from '@/components/reports/FuelEfficiencyChart';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import logoWebp from '@/assets/logo-optimized.webp';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  combustivel: Fuel,
  manutencao: Wrench,
  alimentacao: UtensilsCrossed,
};

export default function Reports() {
  const [range, setRange] = useState<DateRange>('day');
  const { data: settings } = useUserSettings();
  const weekStartsOn = settings?.week_starts_on === 'domingo' ? 0 : 1;
  
  const now = new Date();
  const dateRange = range === 'week'
    ? { start: format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd') }
    : range === 'month'
    ? { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
    : { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };

  // Get last 3 months of data for best times analysis
  const analysisDateRange = {
    start: format(subMonths(now, 3), 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd'),
  };

  const { platformMetrics, isLoading, hasMultiPlatformShifts } = useDashboard(range);
  const { data: expenses } = useExpenses(dateRange.start, dateRange.end);
  const { data: allEarnings } = useEarnings(analysisDateRange.start, analysisDateRange.end);
  const { data: allShifts } = useShifts(analysisDateRange.start, analysisDateRange.end);

  // Calculate expense by category
  const expensesByCategory = expenses?.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const sortedExpenses = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a);

  const bestPlatform = platformMetrics[0];
  const worstPlatform = platformMetrics[platformMetrics.length - 1];

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto scroll-momentum">
        {/* Header with Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src={logoWebp} 
            alt="PEDY Driver" 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg"
            width={80}
            height={80}
            loading="lazy"
          />
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Análise detalhada dos seus resultados</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector value={range} onChange={setRange} />

        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
            <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Best & Worst Platform - PRO Feature */}
            <FeatureGate feature="platformRanking" showTeaser>
              {platformMetrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-xl p-3 sm:p-4 bg-card border border-border/50 touch-feedback">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-profit" />
                      <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase">Melhor</span>
                    </div>
                    {bestPlatform ? (
                      <>
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{bestPlatform.platform.name}</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-profit">
                          {formatCurrency(bestPlatform.profit)}
                        </p>
                        <p className="text-2xs sm:text-xs text-muted-foreground">
                          {formatCurrency(bestPlatform.revenuePerHour)}/hora
                        </p>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>

                  <div className="rounded-xl p-3 sm:p-4 bg-card border border-border/50 touch-feedback">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-expense" />
                      <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase">Pior</span>
                    </div>
                    {worstPlatform && platformMetrics.length > 1 ? (
                      <>
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{worstPlatform.platform.name}</p>
                        <p className={cn(
                          'text-base sm:text-lg font-bold font-mono',
                          worstPlatform.profit >= 0 ? 'text-foreground' : 'text-expense'
                        )}>
                          {formatCurrency(worstPlatform.profit)}
                        </p>
                        <p className="text-2xs sm:text-xs text-muted-foreground">
                          {formatCurrency(worstPlatform.revenuePerHour)}/hora
                        </p>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </div>
              )}
            </FeatureGate>

            {/* Best Times Analysis - PRO Feature */}
            <FeatureGate feature="bestTimes" showTeaser>
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Melhores Dias e Horários
                </h2>
                <BestTimesAnalysis 
                  earnings={allEarnings || []} 
                  shifts={allShifts || []} 
                />
              </div>
            </FeatureGate>

            {/* Fuel Efficiency Chart - PRO Feature */}
            <FeatureGate feature="bestTimes" showTeaser>
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Eficiência de Combustível
                </h2>
                <FuelEfficiencyChart 
                  expenses={allEarnings ? (expenses || []).map(e => ({
                    id: e.id,
                    date: e.date,
                    amount: Number(e.amount),
                    category: e.category,
                  })) : []}
                  shifts={(allShifts || []).map(s => ({
                    id: s.id,
                    date: s.date,
                    km_driven: Number(s.km_driven),
                  }))}
                />
              </div>
            </FeatureGate>

            {/* Expenses by Category */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Gastos por Categoria</h2>
              
              {sortedExpenses.length === 0 ? (
                <div className="rounded-xl p-5 sm:p-6 bg-card border border-border/50 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum gasto registrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedExpenses.map(([category, amount], index) => {
                    const Icon = categoryIcons[category] || Fuel;
                    const total = sortedExpenses.reduce((sum, [, v]) => sum + v, 0);
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    
                    return (
                      <div 
                        key={category} 
                        className="rounded-xl p-3 sm:p-4 bg-card border border-border/50 flex items-center gap-3 sm:gap-4 touch-feedback"
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm sm:text-base text-foreground truncate">
                              {EXPENSE_CATEGORY_LABELS[category]}
                            </span>
                            <span className="font-mono text-sm sm:text-base font-semibold text-expense flex-shrink-0 ml-2">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-expense rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Rankings - PRO Feature */}
            <FeatureGate feature="platformRanking" showTeaser>
              {platformMetrics.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">Ranking de Plataformas</h2>
                  
                  {hasMultiPlatformShifts && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-primary">
                        Horas e KMs são distribuídos proporcionalmente pela receita de cada plataforma. 
                        Quem gerou mais receita, provavelmente consumiu mais tempo e quilômetros.
                      </p>
                    </div>
                  )}
                  
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[320px]">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="text-left text-2xs sm:text-xs font-medium text-muted-foreground p-2.5 sm:p-3">#</th>
                            <th className="text-left text-2xs sm:text-xs font-medium text-muted-foreground p-2.5 sm:p-3">Plataforma</th>
                            <th className="text-right text-2xs sm:text-xs font-medium text-muted-foreground p-2.5 sm:p-3">R$/h</th>
                            <th className="text-right text-2xs sm:text-xs font-medium text-muted-foreground p-2.5 sm:p-3">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card">
                          {platformMetrics.map((pm, index) => (
                            <tr key={pm.platform.id} className="border-t border-border/50">
                              <td className="p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-muted-foreground">{index + 1}</td>
                              <td className="p-2.5 sm:p-3">
                                <span className="font-medium text-sm sm:text-base text-foreground">{pm.platform.name}</span>
                              </td>
                              <td className="p-2.5 sm:p-3 text-right font-mono text-xs sm:text-sm text-foreground">
                                {formatCurrency(pm.revenuePerHour)}
                              </td>
                              <td className={cn(
                                'p-2.5 sm:p-3 text-right font-mono text-xs sm:text-sm font-semibold',
                                pm.profit >= 0 ? 'text-profit' : 'text-expense'
                              )}>
                                {formatCurrency(pm.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </FeatureGate>
          </>
        )}
      </div>
    </AppLayout>
  );
}
