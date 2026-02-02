import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'number' | 'hours' | 'km';
  variant?: 'default' | 'profit' | 'expense' | 'accent';
  icon?: ReactNode;
  subtitle?: string;
  secondaryValue?: number;
  secondaryLabel?: string;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  format = 'currency', 
  variant = 'default',
  icon,
  subtitle,
  secondaryValue,
  secondaryLabel,
  className 
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'hours':
        return `${formatNumber(val)}h`;
      case 'km':
        return `${formatNumber(val)} km`;
      default:
        return formatNumber(val, 0);
    }
  };

  const formattedValue = () => formatValue(value);
  const formattedSecondary = () => secondaryValue !== undefined ? formatValue(secondaryValue) : null;

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
        <div className="flex items-center gap-1">
          <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {secondaryValue !== undefined && (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  type="button"
                  className="p-0.5 rounded-full hover:bg-muted transition-colors"
                  aria-label="Ver explicação"
                >
                  <Info className="w-3 h-3 text-muted-foreground/60" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-[220px] text-xs p-3">
                <p className="font-medium mb-1">Líquido vs Bruto</p>
                <p><strong>Líquido:</strong> Lucro real após descontar custos (combustível, manutenção)</p>
                <p className="mt-1"><strong>Bruto:</strong> Receita total antes dos custos</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {icon && (
          <span className={cn('text-muted-foreground', variant === 'profit' && 'text-profit', variant === 'expense' && 'text-expense')}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 sm:gap-2">
        <p className={cn('text-lg sm:text-xl md:text-2xl font-bold font-mono animate-count-up', valueColorClass())}>
          {formattedValue()}
        </p>
        {secondaryValue !== undefined && (
          <span className="text-2xs sm:text-xs text-muted-foreground font-mono">
            {secondaryLabel || 'bruto'}
          </span>
        )}
      </div>
      {secondaryValue !== undefined && (
        <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <span className="font-mono">{formattedSecondary()}</span>
          <span>bruto</span>
        </p>
      )}
      {subtitle && !secondaryValue && (
        <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>
      )}
    </div>
  );
}
