import { useMemo } from 'react';
import { TrendingUp, MapPin, Clock, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { useGuestMode } from '@/contexts/GuestModeContext';

export function GuestMetrics() {
  const { guestEntries } = useGuestMode();

  const metrics = useMemo(() => {
    const earnings = guestEntries.filter(e => e.type === 'earning');
    const expenses = guestEntries.filter(e => e.type === 'expense');

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalEarnings - totalExpenses;
    
    const totalKm = earnings.reduce((sum, e) => sum + (e.km || 0), 0);
    const totalMinutes = earnings.reduce((sum, e) => sum + (e.minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    const profitPerKm = totalKm > 0 ? netProfit / totalKm : 0;
    const profitPerHour = totalHours > 0 ? netProfit / totalHours : 0;

    return {
      totalEarnings,
      totalExpenses,
      netProfit,
      totalKm,
      totalHours,
      profitPerKm,
      profitPerHour,
      entryCount: earnings.length,
    };
  }, [guestEntries]);

  if (guestEntries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Registre seu primeiro ganho para ver suas métricas
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main profit card */}
      <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
            <p className={`text-3xl font-bold ${metrics.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(metrics.netProfit)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-profit flex items-center justify-center">
            <Wallet className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Ganhos</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(metrics.totalEarnings)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="text-lg font-semibold text-destructive">{formatCurrency(metrics.totalExpenses)}</p>
          </div>
        </div>
      </Card>

      {/* Efficiency metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">R$/km</p>
          </div>
          <p className="text-2xl font-bold">
            {metrics.totalKm > 0 ? formatCurrency(metrics.profitPerKm) : '—'}
          </p>
          {metrics.totalKm > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalKm.toFixed(1)} km rodados
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground">R$/hora</p>
          </div>
          <p className="text-2xl font-bold">
            {metrics.totalHours > 0 ? formatCurrency(metrics.profitPerHour) : '—'}
          </p>
          {metrics.totalHours > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalHours.toFixed(1)}h trabalhadas
            </p>
          )}
        </Card>
      </div>

      {/* Entry count */}
      <p className="text-center text-xs text-muted-foreground">
        {metrics.entryCount} registro{metrics.entryCount !== 1 ? 's' : ''} hoje
      </p>
    </div>
  );
}
