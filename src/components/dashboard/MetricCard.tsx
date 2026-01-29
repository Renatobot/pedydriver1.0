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
      'rounded-xl p-3 sm:p-4 bg-card border border-border/50 transition-all touch-feedback',
      'hover:border-border active:scale-[0.98]',
      className
    )}>
      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
        <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span className={cn('text-muted-foreground', variant === 'profit' && 'text-profit', variant === 'expense' && 'text-expense')}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn('text-lg sm:text-xl md:text-2xl font-bold font-mono animate-count-up', valueColorClass())}>
        {formattedValue()}
      </p>
      {subtitle && (
        <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>
      )}
    </div>
  );
}
