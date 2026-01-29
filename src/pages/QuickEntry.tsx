import { useState, useMemo } from 'react';
import { DollarSign, Navigation, Clock, TrendingUp, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateEarningOffline } from '@/hooks/useOfflineEarnings';
import { useCreateShiftOffline } from '@/hooks/useOfflineShifts';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function QuickEntry() {
  const { data: platforms } = usePlatforms();
  const createEarning = useCreateEarningOffline();
  const createShift = useCreateShiftOffline();

  const [value, setValue] = useState('');
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const metrics = useMemo(() => {
    const valueNum = parseFloat(value) || 0;
    const kmNum = parseFloat(km) || 0;
    const minutesNum = parseFloat(minutes) || 0;

    const revenuePerKm = kmNum > 0 ? valueNum / kmNum : 0;
    const revenuePerHour = minutesNum > 0 ? (valueNum / minutesNum) * 60 : 0;

    return {
      revenuePerKm,
      revenuePerHour,
      hasData: valueNum > 0,
    };
  }, [value, km, minutes]);

  const handleSave = async () => {
    const valueNum = parseFloat(value);
    const kmNum = parseFloat(km) || 0;
    const minutesNum = parseFloat(minutes) || 0;

    if (!valueNum || valueNum <= 0) {
      toast.error('Informe o valor da corrida');
      return;
    }

    if (!platformId) {
      toast.error('Selecione uma plataforma');
      return;
    }

    setIsSaving(true);

    try {
      // Salvar ganho
      await createEarning.mutateAsync({
        platform_id: platformId,
        amount: valueNum,
        service_type: 'corrida',
        earning_type: 'corrida_entrega',
        payment_type: 'app',
        service_count: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Salvar turno se tiver km ou tempo
      if (kmNum > 0 || minutesNum > 0) {
        await createShift.mutateAsync({
          platform_id: platformId,
          km_driven: kmNum,
          hours_worked: minutesNum / 60,
          date: format(new Date(), 'yyyy-MM-dd'),
        });
      }

      toast.success('Corrida registrada!');
      setValue('');
      setKm('');
      setMinutes('');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto scroll-momentum">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-profit flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Entrada Rápida</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Registre e analise instantaneamente</p>
          </div>
        </div>

        {/* Quick Metrics Display */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className={cn(
            "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
            metrics.hasData 
              ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30" 
              : "bg-card border-border/50"
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-2xs sm:text-xs text-muted-foreground">R$/km</span>
            </div>
            <p className={cn(
              "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
              metrics.revenuePerKm > 0 ? "text-emerald-500" : "text-muted-foreground"
            )}>
              {metrics.revenuePerKm > 0 ? formatCurrency(metrics.revenuePerKm) : '—'}
            </p>
          </div>
          
          <div className={cn(
            "p-3 sm:p-4 rounded-2xl border transition-all duration-300 touch-feedback",
            metrics.hasData 
              ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30" 
              : "bg-card border-border/50"
          )}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-2xs sm:text-xs text-muted-foreground">R$/hora</span>
            </div>
            <p className={cn(
              "text-xl sm:text-2xl font-bold font-mono transition-all duration-300",
              metrics.revenuePerHour > 0 ? "text-blue-500" : "text-muted-foreground"
            )}>
              {metrics.revenuePerHour > 0 ? formatCurrency(metrics.revenuePerHour) : '—'}
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border/50 space-y-3 sm:space-y-4">
          {/* Platform */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm text-muted-foreground">Plataforma</Label>
            <Select value={platformId} onValueChange={setPlatformId}>
              <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {platforms?.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="py-3">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value - Main input */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm text-muted-foreground">Valor da Corrida</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 sm:pl-12 h-14 sm:h-16 text-xl sm:text-2xl font-mono font-bold text-center"
              />
            </div>
          </div>

          {/* KM and Time - Side by side */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Km Rodados</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Tempo (min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !value || !platformId}
            className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-profit hover:opacity-90 transition-opacity touch-feedback"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Registrar Corrida
              </div>
            )}
          </Button>
        </div>

        {/* Tips */}
        <div className="text-center text-2xs sm:text-xs text-muted-foreground">
          <p>💡 Preencha km e tempo para calcular suas métricas</p>
        </div>
      </div>
    </AppLayout>
  );
}
