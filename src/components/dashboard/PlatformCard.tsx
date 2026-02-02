import { memo, useState } from 'react';
import { Car, Bike, Truck, Package, Zap, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { PlatformMetrics } from '@/types/database';

interface PlatformCardProps {
  data: PlatformMetrics;
  rank: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  bike: Bike,
  truck: Truck,
  package: Package,
  bicycle: Bike,
  ebike: Zap,
  'more-horizontal': MoreHorizontal
};

export const PlatformCard = memo(function PlatformCard({ data, rank }: PlatformCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[data.platform.icon || 'car'] || Car;
  const isPositive = data.profit >= 0;

  return (
    <div 
      className={cn(
        'rounded-xl bg-card border border-border/50 transition-all duration-200 overflow-hidden cursor-pointer',
        'hover:border-border active:scale-[0.99]',
        isExpanded && 'border-primary/30'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: data.platform.color + '20' }}
          >
            <Icon 
              className="w-4 h-4 sm:w-5 sm:h-5" 
              style={{ color: data.platform.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-2xs sm:text-xs font-bold text-muted-foreground">#{rank}</span>
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{data.platform.name}</h3>
            </div>
            <p className="text-2xs sm:text-xs text-muted-foreground">
              {data.services} serviços • {formatNumber(data.hours)}h
            </p>
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <p className={cn(
                'text-base sm:text-lg font-bold font-mono',
                isPositive ? 'text-profit' : 'text-expense'
              )}>
                {formatCurrency(data.profit)}
              </p>
              <p className="text-2xs text-muted-foreground">lucro</p>
            </div>
            <span className={cn(
              'text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}>
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div 
        className={cn(
          'grid transition-all duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border/30 pt-3">
            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-2xs sm:text-xs text-muted-foreground">R$/hora</p>
                <p className={cn('text-xs sm:text-sm font-semibold font-mono', data.revenuePerHour >= 0 ? 'text-foreground' : 'text-expense')}>
                  {formatCurrency(data.revenuePerHour)}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-2xs sm:text-xs text-muted-foreground">R$/km</p>
                <p className={cn('text-xs sm:text-sm font-semibold font-mono', data.revenuePerKm >= 0 ? 'text-foreground' : 'text-expense')}>
                  {formatCurrency(data.revenuePerKm)}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-2xs sm:text-xs text-muted-foreground">Média</p>
                <p className="text-xs sm:text-sm font-semibold font-mono text-foreground">
                  {formatCurrency(data.avgPerService)}
                </p>
              </div>
            </div>

            {/* Detailed breakdown */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Receita</span>
                <span className="font-mono text-profit">{formatCurrency(data.revenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gastos diretos</span>
                <span className="font-mono text-expense">-{formatCurrency(data.directExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gastos rateados</span>
                <span className="font-mono text-expense">-{formatCurrency(data.sharedExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Custo por km ({formatNumber(data.km)} km)</span>
                <span className="font-mono text-expense">-{formatCurrency(data.kmCost)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border/30">
                <span className="font-medium">Lucro líquido</span>
                <span className={cn('font-mono font-bold', isPositive ? 'text-profit' : 'text-expense')}>
                  {formatCurrency(data.profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
