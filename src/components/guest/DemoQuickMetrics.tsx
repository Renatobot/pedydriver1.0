import { memo } from 'react';
import { Navigation, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface DemoQuickMetricsProps {
  grossRevenuePerKm: number;
  grossRevenuePerHour: number;
  netRevenuePerKm: number;
  netRevenuePerHour: number;
  kmCost: number;
  costPerKm: number;
  hasData: boolean;
}

export const DemoQuickMetrics = memo(function DemoQuickMetrics({
  grossRevenuePerKm,
  grossRevenuePerHour,
  netRevenuePerKm,
  netRevenuePerHour,
  kmCost,
  costPerKm,
  hasData,
}: DemoQuickMetricsProps) {
  return (
    <div className="space-y-2">
      {/* Métricas Brutas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className={cn(
          "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
          hasData 
            ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30" 
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-2xs sm:text-xs text-muted-foreground">R$/km bruto</span>
          </div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
            grossRevenuePerKm > 0 ? "text-blue-500" : "text-muted-foreground"
          )}>
            {grossRevenuePerKm > 0 ? formatCurrency(grossRevenuePerKm) : '—'}
          </p>
        </div>
        
        <div className={cn(
          "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
          hasData 
            ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30" 
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-2xs sm:text-xs text-muted-foreground">R$/hora bruto</span>
          </div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
            grossRevenuePerHour > 0 ? "text-blue-500" : "text-muted-foreground"
          )}>
            {grossRevenuePerHour > 0 ? formatCurrency(grossRevenuePerHour) : '—'}
          </p>
        </div>
      </div>

      {/* Métricas Líquidas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className={cn(
          "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
          hasData 
            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30" 
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-2xs sm:text-xs text-muted-foreground">R$/km líquido</span>
          </div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
            netRevenuePerKm > 0 ? "text-emerald-500" : netRevenuePerKm < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {netRevenuePerKm !== 0 ? formatCurrency(netRevenuePerKm) : '—'}
          </p>
        </div>
        
        <div className={cn(
          "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
          hasData 
            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30" 
            : "bg-card border-border/50"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="text-2xs sm:text-xs text-muted-foreground">R$/hora líquido</span>
          </div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
            netRevenuePerHour > 0 ? "text-emerald-500" : netRevenuePerHour < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {netRevenuePerHour !== 0 ? formatCurrency(netRevenuePerHour) : '—'}
          </p>
        </div>
      </div>

      {/* Custo por Km info */}
      {kmCost > 0 && (
        <p className="text-center text-2xs sm:text-xs text-muted-foreground">
          💡 Custo estimado: {formatCurrency(kmCost)} ({formatCurrency(costPerKm)}/km)
        </p>
      )}
    </div>
  );
});
