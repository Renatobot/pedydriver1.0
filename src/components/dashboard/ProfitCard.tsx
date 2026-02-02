import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProfitCardProps {
  value: number;
  label?: string;
  secondaryValue?: number;
  secondaryLabel?: string;
}

export function ProfitCard({ 
  value, 
  label = 'Lucro Real',
  secondaryValue,
  secondaryLabel = 'Receita Bruta'
}: ProfitCardProps) {
  const isPositive = value >= 0;

  return (
    <div className={cn(
      'rounded-2xl p-4 sm:p-6 transition-all touch-feedback',
      isPositive ? 'bg-gradient-profit glow-profit' : 'bg-gradient-expense glow-expense'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-medium text-primary-foreground/80 uppercase tracking-wide">
            {label}
          </span>
          {secondaryValue !== undefined && (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  type="button"
                  className="p-0.5 rounded-full hover:bg-primary-foreground/10 transition-colors"
                  aria-label="Ver explicação"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground/60" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-[240px] text-xs p-3">
                <p className="font-semibold mb-1.5">Líquido vs Bruto</p>
                <p><strong>Líquido:</strong> Lucro real após descontar custos de combustível e manutenção por km rodado.</p>
                <p className="mt-1.5"><strong>Bruto:</strong> Receita total recebida, antes de qualquer desconto.</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {isPositive ? (
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground/80" />
        ) : (
          <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground/80" />
        )}
      </div>
      <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-primary-foreground animate-count-up">
        {formatCurrency(value)}
      </p>
      {secondaryValue !== undefined && (
        <p className="text-xs sm:text-sm text-primary-foreground/70 mt-1 flex items-center gap-1.5">
          <span className="font-mono">{formatCurrency(secondaryValue)}</span>
          <span className="lowercase">{secondaryLabel}</span>
        </p>
      )}
    </div>
  );
}
