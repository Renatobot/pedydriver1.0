import { useMemo } from 'react';
import { Clock, Calendar, TrendingUp, Sparkles, Info, Sun, Sunset, Moon, CloudMoon } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface Earning {
  id: string;
  date: string;
  amount: number;
  created_at: string;
}

interface Shift {
  id: string;
  date: string;
  hours_worked: number;
  created_at: string;
}

interface BestTimesAnalysisProps {
  earnings: Earning[];
  shifts: Shift[];
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_FULL_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIME_SLOTS = [
  { id: 'morning', name: 'Manhã', range: '06h-12h', icon: Sun, start: 6, end: 12 },
  { id: 'afternoon', name: 'Tarde', range: '12h-18h', icon: Sunset, start: 12, end: 18 },
  { id: 'evening', name: 'Noite', range: '18h-24h', icon: Moon, start: 18, end: 24 },
  { id: 'night', name: 'Madrugada', range: '00h-06h', icon: CloudMoon, start: 0, end: 6 },
];

export function BestTimesAnalysis({ earnings, shifts }: BestTimesAnalysisProps) {
  const analysis = useMemo(() => {
    // Group earnings by day of week
    const earningsByDay: Record<number, { total: number; count: number; hours: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      earningsByDay[i] = { total: 0, count: 0, hours: 0 };
    }

    // Group earnings by time slot
    const earningsByTimeSlot: Record<string, { total: number; count: number }> = {
      morning: { total: 0, count: 0 },
      afternoon: { total: 0, count: 0 },
      evening: { total: 0, count: 0 },
      night: { total: 0, count: 0 },
    };

    // Process earnings
    earnings.forEach((earning) => {
      const date = new Date(earning.date + 'T12:00:00');
      const dayOfWeek = date.getDay();
      earningsByDay[dayOfWeek].total += Number(earning.amount);
      earningsByDay[dayOfWeek].count += 1;

      // Process by time slot using created_at
      if (earning.created_at) {
        const createdAt = new Date(earning.created_at);
        const hour = createdAt.getHours();
        
        let slotId = 'night';
        if (hour >= 6 && hour < 12) slotId = 'morning';
        else if (hour >= 12 && hour < 18) slotId = 'afternoon';
        else if (hour >= 18 && hour < 24) slotId = 'evening';
        
        earningsByTimeSlot[slotId].total += Number(earning.amount);
        earningsByTimeSlot[slotId].count += 1;
      }
    });

    // Process shifts to get hours per day
    shifts.forEach((shift) => {
      const date = new Date(shift.date + 'T12:00:00');
      const dayOfWeek = date.getDay();
      earningsByDay[dayOfWeek].hours += Number(shift.hours_worked);
    });

    // Calculate averages and revenue per hour
    const dayStats = Object.entries(earningsByDay).map(([day, data]) => ({
      day: parseInt(day),
      dayName: DAY_NAMES[parseInt(day)],
      dayFullName: DAY_FULL_NAMES[parseInt(day)],
      totalRevenue: data.total,
      avgRevenue: data.count > 0 ? data.total / data.count : 0,
      revenuePerHour: data.hours > 0 ? data.total / data.hours : 0,
      totalHours: data.hours,
      daysWorked: data.count,
    })).filter(d => d.daysWorked > 0);

    // Calculate time slot stats
    const timeSlotStats = TIME_SLOTS.map(slot => ({
      ...slot,
      total: earningsByTimeSlot[slot.id].total,
      count: earningsByTimeSlot[slot.id].count,
      avgPerEntry: earningsByTimeSlot[slot.id].count > 0 
        ? earningsByTimeSlot[slot.id].total / earningsByTimeSlot[slot.id].count 
        : 0,
    })).filter(s => s.count > 0);

    // Sort time slots by average per entry
    const sortedTimeSlots = [...timeSlotStats].sort((a, b) => b.avgPerEntry - a.avgPerEntry);
    const maxTimeSlotAvg = Math.max(...timeSlotStats.map(s => s.avgPerEntry), 1);

    // Sort by revenue per hour (best metric for efficiency)
    const sortedByEfficiency = [...dayStats].sort((a, b) => b.revenuePerHour - a.revenuePerHour);
    const sortedByTotal = [...dayStats].sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Find best and worst days
    const bestDay = sortedByEfficiency[0];
    const worstDay = sortedByEfficiency[sortedByEfficiency.length - 1];
    const highestRevenueDay = sortedByTotal[0];
    const bestTimeSlot = sortedTimeSlots[0];

    // Calculate max for progress bars
    const maxRevenuePerHour = Math.max(...dayStats.map(d => d.revenuePerHour), 1);

    return {
      dayStats,
      sortedByEfficiency,
      bestDay,
      worstDay,
      highestRevenueDay,
      maxRevenuePerHour,
      hasData: dayStats.length > 0,
      timeSlotStats,
      sortedTimeSlots,
      maxTimeSlotAvg,
      bestTimeSlot,
      hasTimeSlotData: timeSlotStats.length > 0,
    };
  }, [earnings, shifts]);

  if (!analysis.hasData) {
    return (
      <div className="rounded-xl p-6 bg-card border border-border/50 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Registre mais corridas para ver a análise</p>
        <p className="text-xs text-muted-foreground mt-1">Precisamos de dados de pelo menos 2 dias</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Best Day Highlight */}
      {analysis.bestDay && (
        <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">
              Melhor dia para trabalhar
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">{analysis.bestDay.dayFullName}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-muted-foreground">
              <span className="font-mono font-semibold text-emerald-500">
                {formatCurrency(analysis.bestDay.revenuePerHour)}
              </span>/hora
            </span>
            <span className="text-muted-foreground">
              {analysis.bestDay.daysWorked}x trabalhado
            </span>
          </div>
        </div>
      )}

      {/* Day of Week Chart */}
      <div className="rounded-xl p-4 bg-card border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Rendimento por dia</span>
        </div>
        
        <div className="space-y-3">
          {analysis.sortedByEfficiency.map((day) => {
            const percentage = (day.revenuePerHour / analysis.maxRevenuePerHour) * 100;
            const isBest = day.day === analysis.bestDay?.day;
            
            return (
              <div key={day.day} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    "font-medium",
                    isBest ? "text-emerald-500" : "text-foreground"
                  )}>
                    {day.dayName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {day.totalHours.toFixed(1)}h
                    </span>
                    <span className={cn(
                      "font-mono text-sm font-semibold",
                      isBest ? "text-emerald-500" : "text-foreground"
                    )}>
                      {formatCurrency(day.revenuePerHour)}/h
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isBest 
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                        : "bg-gradient-to-r from-primary/60 to-primary/40"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Slot Analysis */}
      {analysis.hasTimeSlotData && (
        <div className="rounded-xl p-4 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Melhor horário</span>
          </div>

          {analysis.bestTimeSlot && (
            <div className="rounded-lg p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 mb-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = analysis.bestTimeSlot.icon;
                  return <IconComponent className="w-4 h-4 text-primary" />;
                })()}
                <span className="font-semibold text-foreground">{analysis.bestTimeSlot.name}</span>
                <span className="text-xs text-muted-foreground">{analysis.bestTimeSlot.range}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Média de <span className="font-mono font-semibold text-primary">{formatCurrency(analysis.bestTimeSlot.avgPerEntry)}</span> por registro
              </p>
            </div>
          )}

          <div className="space-y-3">
            {analysis.sortedTimeSlots.map((slot) => {
              const percentage = (slot.avgPerEntry / analysis.maxTimeSlotAvg) * 100;
              const isBest = slot.id === analysis.bestTimeSlot?.id;
              const IconComponent = slot.icon;

              return (
                <div key={slot.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn(
                        "w-3.5 h-3.5",
                        isBest ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        isBest ? "text-primary" : "text-foreground"
                      )}>
                        {slot.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{slot.range}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {slot.count}x
                      </span>
                      <span className={cn(
                        "font-mono text-sm font-semibold",
                        isBest ? "text-primary" : "text-foreground"
                      )}>
                        {formatCurrency(slot.avgPerEntry)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isBest
                          ? "bg-gradient-to-r from-primary to-primary/70"
                          : "bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-xl p-4 bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground text-sm">Insights</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {analysis.bestDay && analysis.worstDay && analysis.bestDay.day !== analysis.worstDay.day && (
            <p>
              💡 Você ganha <span className="text-foreground font-semibold">
                {((analysis.bestDay.revenuePerHour / analysis.worstDay.revenuePerHour - 1) * 100).toFixed(0)}% mais
              </span> por hora em <span className="text-foreground">{analysis.bestDay.dayFullName}</span> do que em{' '}
              <span className="text-foreground">{analysis.worstDay.dayFullName}</span>
            </p>
          )}
          {analysis.highestRevenueDay && (
            <p>
              📊 Maior receita total: <span className="text-foreground font-semibold">
                {formatCurrency(analysis.highestRevenueDay.totalRevenue)}
              </span> em {analysis.highestRevenueDay.dayFullName}s
            </p>
          )}
          {analysis.bestTimeSlot && (
            <p>
              ⏰ Melhor período: <span className="text-foreground font-semibold">{analysis.bestTimeSlot.name}</span> ({analysis.bestTimeSlot.range})
            </p>
          )}
        </div>
      </div>

      {/* Multi-platform warning */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Turnos com múltiplas plataformas têm horas e km registrados de forma agregada, não sendo possível calcular métricas individuais por plataforma.
        </p>
      </div>
    </div>
  );
}
