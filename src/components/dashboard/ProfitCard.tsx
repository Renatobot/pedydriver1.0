import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface ProfitCardProps {
  value: number;
  label?: string;
}

export function ProfitCard({ value, label = 'Lucro Real' }: ProfitCardProps) {
  const isPositive = value >= 0;

  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all',
      isPositive ? 'bg-gradient-profit glow-profit' : 'bg-gradient-expense glow-expense'
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wide">
          {label}
        </span>
        {isPositive ? (
          <TrendingUp className="w-5 h-5 text-primary-foreground/80" />
        ) : (
          <TrendingDown className="w-5 h-5 text-primary-foreground/80" />
        )}
      </div>
      <p className="text-3xl font-bold font-mono text-primary-foreground animate-count-up">
        {formatCurrency(value)}
      </p>
    </div>
  );
}
