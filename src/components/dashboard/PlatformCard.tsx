import { Car, Bike, Truck, Package } from 'lucide-react';
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
  package: Package
};

export function PlatformCard({ data, rank }: PlatformCardProps) {
  const Icon = iconMap[data.platform.icon || 'car'] || Car;
  const isPositive = data.profit >= 0;

  return (
    <div className="rounded-xl p-4 bg-card border border-border/50 transition-all hover:border-border">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: data.platform.color + '20' }}
        >
          <Icon 
            className="w-5 h-5" 
            style={{ color: data.platform.color }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-muted-foreground">#{rank}</span>
            <h3 className="font-semibold text-foreground">{data.platform.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.services} serviços • {formatNumber(data.hours)}h
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-lg font-bold font-mono',
            isPositive ? 'text-profit' : 'text-expense'
          )}>
            {formatCurrency(data.profit)}
          </p>
          <p className="text-2xs text-muted-foreground">lucro</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">R$/hora</p>
          <p className={cn('text-sm font-semibold font-mono', data.revenuePerHour >= 0 ? 'text-foreground' : 'text-expense')}>
            {formatCurrency(data.revenuePerHour)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">R$/km</p>
          <p className={cn('text-sm font-semibold font-mono', data.revenuePerKm >= 0 ? 'text-foreground' : 'text-expense')}>
            {formatCurrency(data.revenuePerKm)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Média</p>
          <p className="text-sm font-semibold font-mono text-foreground">
            {formatCurrency(data.avgPerService)}
          </p>
        </div>
      </div>
    </div>
  );
}
