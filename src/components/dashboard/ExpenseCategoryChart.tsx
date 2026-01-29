import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { Expense, ExpenseCategory } from '@/types/database';
import { useMemo } from 'react';

interface ExpenseCategoryChartProps {
  expenses: Expense[];
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  alimentacao: 'Alimentação',
  seguro: 'Seguro',
  aluguel: 'Aluguel',
  internet: 'Internet',
  pedagio_estacionamento: 'Pedágio/Est.',
  outros: 'Outros',
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(25 95% 53%)',
  'hsl(262 83% 58%)',
  'hsl(221 83% 53%)',
  'hsl(142 76% 36%)',
  'hsl(0 84% 60%)',
  'hsl(var(--muted-foreground))',
];

export function ExpenseCategoryChart({ expenses }: ExpenseCategoryChartProps) {
  const chartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      byCategory[category] = (byCategory[category] || 0) + Number(expense.amount);
    });

    return Object.entries(byCategory)
      .map(([category, value], index) => ({
        name: CATEGORY_LABELS[category as ExpenseCategory] || category,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="bg-card border-border transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52 animate-fade-in" key={expenses.length}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                animationDuration={800}
                animationEasing="ease-out"
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
