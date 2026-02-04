import { useState, useMemo, useCallback } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickEntry() {
  const { data: platforms } = usePlatforms();
  const { data: userSettings } = useUserSettings();
  const createEarning = useCreateEarningOffline();
  const createShift = useCreateShiftOffline();
  const { canAddEntry, isPro, canUsePlatform, usedPlatformIds, remainingPlatforms } = useSubscriptionContext();

  const costPerKm = userSettings?.cost_per_km || 0.5;

  const [value, setValue] = useState('');
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showBlocker, setShowBlocker] = useState(!canAddEntry);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isBlocked = !canAddEntry && !isPro;

  // Filter platforms based on subscription limits
  const availablePlatforms = platforms?.filter(p => {
    if (isPro) return true;
    return usedPlatformIds.includes(p.id) || remainingPlatforms > 0;
  });

  const handlePlatformChange = (newPlatformId: string) => {
    if (!canUsePlatform(newPlatformId)) {
      setPlatformError('Limite de plataformas atingido. Faça upgrade para usar mais.');
      return;
    }
    setPlatformError(null);
    setPlatformId(newPlatformId);
  };

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

    if (!canUsePlatform(platformId)) {
      setPlatformError('Limite de plataformas atingido.');
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

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      toast.success('Corrida registrada!');
      setValue('');
      setKm('');
      setMinutes('');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [isBlocked, value, km, minutes, platformId, createEarning, createShift, canUsePlatform]);

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
          {/* Success Animation Overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 rounded-full bg-gradient-profit flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-semibold text-foreground"
                  >
                    Registrado! 🎉
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isBlocked && showBlocker && (
            <EntryLimitBlocker onContinueViewing={() => setShowBlocker(false)} />
          )}
          
          <QuickEntryForm
            platforms={availablePlatforms}
            value={value}
            km={km}
            minutes={minutes}
            platformId={platformId}
            isSaving={isSaving}
            isBlocked={isBlocked}
            platformError={platformError}
            usedPlatformIds={usedPlatformIds}
            isPro={isPro}
            onValueChange={setValue}
            onKmChange={setKm}
            onMinutesChange={setMinutes}
            onPlatformChange={handlePlatformChange}
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
