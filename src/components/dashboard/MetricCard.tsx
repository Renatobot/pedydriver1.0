import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'number' | 'hours' | 'km';
  variant?: 'default' | 'profit' | 'expense' | 'accent';
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  format = 'currency', 
  variant = 'default',
  icon,
  subtitle,
  className 
}: MetricCardProps) {
  const formattedValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'hours':
        return `${formatNumber(value)}h`;
      case 'km':
        return `${formatNumber(value)} km`;
      default:
        return formatNumber(value, 0);
    }
  };

  const valueColorClass = () => {
    switch (variant) {
      case 'profit':
        return 'text-profit';
      case 'expense':
        return 'text-expense';
      case 'accent':
        return 'text-accent';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn(
      'rounded-xl p-4 bg-card border border-border/50 transition-all',
      'hover:border-border active:scale-[0.98]',
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span className={cn('text-muted-foreground', variant === 'profit' && 'text-profit', variant === 'expense' && 'text-expense')}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn('text-xl font-bold font-mono animate-count-up', valueColorClass())}>
        {formattedValue()}
      </p>
      {subtitle && (
        <p className="text-2xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
