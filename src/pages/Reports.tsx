import { useState } from 'react';
import { TrendingUp, TrendingDown, Fuel, Wrench, UtensilsCrossed, Clock } from 'lucide-react';
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

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  combustivel: Fuel,
  manutencao: Wrench,
  alimentacao: UtensilsCrossed,
};

export default function Reports() {
  const [range, setRange] = useState<DateRange>('week');
  const { data: settings } = useUserSettings();
  const weekStartsOn = settings?.week_starts_on === 'domingo' ? 0 : 1;
  
  const now = new Date();
  const dateRange = range === 'week'
    ? { start: format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd') }
    : { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };

  // Get last 3 months of data for best times analysis
  const analysisDateRange = {
    start: format(subMonths(now, 3), 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd'),
  };

  const { platformMetrics, isLoading } = useDashboard(range);
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
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Análise detalhada dos seus resultados</p>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector value={range} onChange={setRange} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Best & Worst Platform */}
            {platformMetrics.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-profit" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">Melhor</span>
                  </div>
                  {bestPlatform ? (
                    <>
                      <p className="font-semibold text-foreground">{bestPlatform.platform.name}</p>
                      <p className="text-lg font-bold font-mono text-profit">
                        {formatCurrency(bestPlatform.profit)}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {formatCurrency(bestPlatform.revenuePerHour)}/hora
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  )}
                </div>

                <div className="rounded-xl p-4 bg-card border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-expense" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">Pior</span>
                  </div>
                  {worstPlatform && platformMetrics.length > 1 ? (
                    <>
                      <p className="font-semibold text-foreground">{worstPlatform.platform.name}</p>
                      <p className={cn(
                        'text-lg font-bold font-mono',
                        worstPlatform.profit >= 0 ? 'text-foreground' : 'text-expense'
                      )}>
                        {formatCurrency(worstPlatform.profit)}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {formatCurrency(worstPlatform.revenuePerHour)}/hora
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  )}
                </div>
              </div>
            )}

            {/* Best Times Analysis - NEW */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Melhores Dias para Trabalhar
              </h2>
              <BestTimesAnalysis 
                earnings={allEarnings || []} 
                shifts={allShifts || []} 
              />
            </div>

            {/* Expenses by Category */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Gastos por Categoria</h2>
              
              {sortedExpenses.length === 0 ? (
                <div className="rounded-xl p-6 bg-card border border-border/50 text-center">
                  <p className="text-muted-foreground">Nenhum gasto registrado</p>
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
                        className="rounded-xl p-4 bg-card border border-border/50 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">
                              {EXPENSE_CATEGORY_LABELS[category]}
                            </span>
                            <span className="font-mono font-semibold text-expense">
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

            {/* Platform Rankings */}
            {platformMetrics.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Ranking de Plataformas</h2>
                
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">#</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Plataforma</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-3">R$/h</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-3">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card">
                      {platformMetrics.map((pm, index) => (
                        <tr key={pm.platform.id} className="border-t border-border/50">
                          <td className="p-3 text-sm font-bold text-muted-foreground">{index + 1}</td>
                          <td className="p-3">
                            <span className="font-medium text-foreground">{pm.platform.name}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-sm text-foreground">
                            {formatCurrency(pm.revenuePerHour)}
                          </td>
                          <td className={cn(
                            'p-3 text-right font-mono text-sm font-semibold',
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
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
