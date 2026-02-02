import { useState, useMemo, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateEarningOffline } from '@/hooks/useOfflineEarnings';
import { useCreateShiftOffline } from '@/hooks/useOfflineShifts';
import { useUserSettings } from '@/hooks/useUserSettings';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { EntryLimitBanner } from '@/components/subscription/EntryLimitBanner';
import { EntryLimitBlocker } from '@/components/subscription/EntryLimitBlocker';
import { QuickEntryMetrics } from '@/components/quick-entry/QuickEntryMetrics';
import { QuickEntryForm } from '@/components/quick-entry/QuickEntryForm';

export default function QuickEntry() {
  const { data: platforms } = usePlatforms();
  const { data: userSettings } = useUserSettings();
  const createEarning = useCreateEarningOffline();
  const createShift = useCreateShiftOffline();
  const { canAddEntry, isPro } = useSubscriptionContext();

  const costPerKm = userSettings?.cost_per_km || 0.5;

  const [value, setValue] = useState('');
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showBlocker, setShowBlocker] = useState(!canAddEntry);

  const isBlocked = !canAddEntry && !isPro;

  const metrics = useMemo(() => {
    const valueNum = parseFloat(value) || 0;
    const kmNum = parseFloat(km) || 0;
    const minutesNum = parseFloat(minutes) || 0;

    const grossRevenuePerKm = kmNum > 0 ? valueNum / kmNum : 0;
    const grossRevenuePerHour = minutesNum > 0 ? (valueNum / minutesNum) * 60 : 0;

    const kmCost = kmNum * costPerKm;
    const netProfit = valueNum - kmCost;
    const netRevenuePerKm = kmNum > 0 ? netProfit / kmNum : 0;
    const netRevenuePerHour = minutesNum > 0 ? (netProfit / minutesNum) * 60 : 0;

    return {
      grossRevenuePerKm,
      grossRevenuePerHour,
      netRevenuePerKm,
      netRevenuePerHour,
      kmCost,
      hasData: valueNum > 0,
    };
  }, [value, km, minutes, costPerKm]);

  const handleSave = useCallback(async () => {
    if (isBlocked) {
      setShowBlocker(true);
      return;
    }

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
      await createEarning.mutateAsync({
        platform_id: platformId,
        amount: valueNum,
        service_type: 'corrida',
        earning_type: 'corrida_entrega',
        payment_type: 'app',
        service_count: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

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
  }, [isBlocked, value, km, minutes, platformId, createEarning, createShift]);

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

        {/* Entry Limit Banner */}
        {!isPro && <EntryLimitBanner showAlways />}

        {/* Quick Metrics Display */}
        <QuickEntryMetrics
          grossRevenuePerKm={metrics.grossRevenuePerKm}
          grossRevenuePerHour={metrics.grossRevenuePerHour}
          netRevenuePerKm={metrics.netRevenuePerKm}
          netRevenuePerHour={metrics.netRevenuePerHour}
          kmCost={metrics.kmCost}
          costPerKm={costPerKm}
          hasData={metrics.hasData}
        />

        {/* Input Form */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border/50 space-y-3 sm:space-y-4 relative">
          {isBlocked && showBlocker && (
            <EntryLimitBlocker onContinueViewing={() => setShowBlocker(false)} />
          )}
          
          <QuickEntryForm
            platforms={platforms}
            value={value}
            km={km}
            minutes={minutes}
            platformId={platformId}
            isSaving={isSaving}
            isBlocked={isBlocked}
            onValueChange={setValue}
            onKmChange={setKm}
            onMinutesChange={setMinutes}
            onPlatformChange={setPlatformId}
            onSave={handleSave}
          />
        </div>

        {/* Tips */}
        <div className="text-center text-2xs sm:text-xs text-muted-foreground">
          <p>💡 Preencha km e tempo para calcular suas métricas</p>
        </div>
      </div>
    </AppLayout>
  );
}
