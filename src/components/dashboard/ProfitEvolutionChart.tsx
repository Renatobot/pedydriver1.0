import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Earning, Expense } from '@/types/database';
import { DateRange } from '@/hooks/useDashboard';

interface ProfitEvolutionChartProps {
  earnings: Earning[];
  expenses: Expense[];
  range: DateRange;
  weekStartsOn: 0 | 1;
  costPerKm: number;
}

export function ProfitEvolutionChart({ 
  earnings, 
  expenses, 
  range, 
  weekStartsOn,
  costPerKm 
}: ProfitEvolutionChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    let days: Date[];
    
    if (range === 'week') {
      const start = startOfWeek(now, { weekStartsOn });
      const end = endOfWeek(now, { weekStartsOn });
      days = eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      days = eachDayOfInterval({ start, end });
    }

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayEarnings = earnings.filter(e => e.date === dateStr);
      const dayExpenses = expenses.filter(e => e.date === dateStr);
      
      const revenue = dayEarnings.reduce((sum, e) => sum + Number(e.amount), 0);
      const expenseTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const profit = revenue - expenseTotal;

      return {
        date: dateStr,
        label: format(day, range === 'week' ? 'EEE' : 'dd', { locale: ptBR }),
        revenue,
        expenses: expenseTotal,
        profit,
      };
    });
  }, [earnings, expenses, range, weekStartsOn]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {format(parseISO(label), "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Evolução {range === 'week' ? 'Semanal' : 'Mensal'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="label" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Lucro"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
