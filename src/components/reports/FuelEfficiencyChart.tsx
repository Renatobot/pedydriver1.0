import { useMemo } from 'react';
import { Fuel, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
}

interface Shift {
  id: string;
  date: string;
  km_driven: number;
}

interface FuelEfficiencyChartProps {
  expenses: Expense[];
  shifts: Shift[];
}

interface WeeklyData {
  week: string;
  weekLabel: string;
  fuelCost: number;
  km: number;
  costPer100km: number;
}

export function FuelEfficiencyChart({ expenses, shifts }: FuelEfficiencyChartProps) {
  const analysis = useMemo(() => {
    // Group by week
    const weeklyMap: Record<string, { fuel: number; km: number }> = {};

    // Process fuel expenses
    expenses
      .filter(e => e.category === 'combustivel')
      .forEach(expense => {
        const weekStart = format(startOfWeek(parseISO(expense.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        if (!weeklyMap[weekStart]) {
          weeklyMap[weekStart] = { fuel: 0, km: 0 };
        }
        weeklyMap[weekStart].fuel += Number(expense.amount);
      });

    // Process shifts for km
    shifts.forEach(shift => {
      const weekStart = format(startOfWeek(parseISO(shift.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!weeklyMap[weekStart]) {
        weeklyMap[weekStart] = { fuel: 0, km: 0 };
      }
      weeklyMap[weekStart].km += Number(shift.km_driven);
    });

    // Calculate cost per 100km for each week
    const weeklyData: WeeklyData[] = Object.entries(weeklyMap)
      .filter(([, data]) => data.km > 0 && data.fuel > 0)
      .map(([week, data]) => ({
        week,
        weekLabel: format(parseISO(week), "dd/MM", { locale: ptBR }),
        fuelCost: data.fuel,
        km: data.km,
        costPer100km: (data.fuel / data.km) * 100,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8); // Last 8 weeks

    if (weeklyData.length === 0) {
      return { hasData: false, weeklyData: [], avg: 0, trend: 0, maxCost: 0 };
    }

    // Calculate average
    const avg = weeklyData.reduce((sum, w) => sum + w.costPer100km, 0) / weeklyData.length;

    // Calculate trend (compare last 2 weeks to previous 2 weeks)
    let trend = 0;
    if (weeklyData.length >= 4) {
      const recent = (weeklyData[weeklyData.length - 1].costPer100km + weeklyData[weeklyData.length - 2].costPer100km) / 2;
      const previous = (weeklyData[weeklyData.length - 3].costPer100km + weeklyData[weeklyData.length - 4].costPer100km) / 2;
      trend = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    }

    const maxCost = Math.max(...weeklyData.map(w => w.costPer100km));

    return {
      hasData: true,
      weeklyData,
      avg,
      trend,
      maxCost,
    };
  }, [expenses, shifts]);

  if (!analysis.hasData) {
    return (
      <div className="rounded-xl p-6 bg-card border border-border/50 text-center">
        <Fuel className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Sem dados de combustível</p>
        <p className="text-xs text-muted-foreground mt-1">
          Registre gastos com combustível e km rodados
        </p>
      </div>
    );
  }

  const trendIsPositive = analysis.trend > 0; // Positive trend is bad (costs increasing)

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl p-4 bg-card border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground text-sm">Custo por 100 km</span>
          </div>
          {analysis.trend !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trendIsPositive 
                ? "bg-red-500/10 text-red-500" 
                : "bg-emerald-500/10 text-emerald-500"
            )}>
              {trendIsPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(analysis.trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="text-2xl font-bold font-mono text-foreground mb-1">
          {formatCurrency(analysis.avg)}
          <span className="text-sm font-normal text-muted-foreground">/100km</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Média das últimas {analysis.weeklyData.length} semanas
        </p>
      </div>

      {/* Weekly Chart */}
      <div className="rounded-xl p-4 bg-card border border-border/50">
        <p className="text-xs font-medium text-muted-foreground mb-3">Evolução semanal</p>
        
        <div className="space-y-2">
          {analysis.weeklyData.map((week, index) => {
            const percentage = (week.costPer100km / analysis.maxCost) * 100;
            const isAboveAvg = week.costPer100km > analysis.avg;
            const isLatest = index === analysis.weeklyData.length - 1;

            return (
              <div key={week.week} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "text-muted-foreground",
                    isLatest && "font-medium text-foreground"
                  )}>
                    {week.weekLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground">
                      {week.km.toFixed(0)} km
                    </span>
                    <span className={cn(
                      "font-mono font-medium",
                      isAboveAvg ? "text-red-500" : "text-emerald-500"
                    )}>
                      {formatCurrency(week.costPer100km)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isAboveAvg 
                        ? "bg-gradient-to-r from-red-400 to-red-500" 
                        : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Average line indicator */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="w-3 h-0.5 bg-muted-foreground rounded" />
          <span className="text-2xs text-muted-foreground">
            Média: {formatCurrency(analysis.avg)}/100km
          </span>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl p-4 bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground text-sm">Dicas de economia</span>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Mantenha os pneus calibrados corretamente</li>
          <li>• Evite acelerações e frenagens bruscas</li>
          <li>• Compare preços em postos diferentes</li>
          <li>• Faça manutenção preventiva regularmente</li>
        </ul>
      </div>
    </div>
  );
}
