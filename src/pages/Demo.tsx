import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, CheckCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { GuestModeBanner } from '@/components/guest/GuestModeBanner';
import { SignupPromptModal } from '@/components/guest/SignupPromptModal';
import { DemoProgressNudge } from '@/components/guest/DemoProgressNudge';
import { DemoExitIntent } from '@/components/guest/DemoExitIntent';
import { DemoSocialProof } from '@/components/guest/DemoSocialProof';
import { DemoQuickEntryForm } from '@/components/guest/DemoQuickEntryForm';
import { DemoQuickMetrics } from '@/components/guest/DemoQuickMetrics';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Default cost per km for demo (same as app default)
const DEFAULT_COST_PER_KM = 0.5;

export default function Demo() {
  const { addGuestEntry } = useGuestMode();
  const { trackDemoPageView, trackDemoEntryAdded, trackDemoToAuth } = useAnalytics();
  
  // Form state
  const [value, setValue] = useState('');
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackDemoPageView();
  }, [trackDemoPageView]);

  // Calculate real-time metrics for the current input
  const liveMetrics = useMemo(() => {
    const valueNum = parseFloat(value) || 0;
    const kmNum = parseFloat(km) || 0;
    const minutesNum = parseFloat(minutes) || 0;

    const grossRevenuePerKm = kmNum > 0 ? valueNum / kmNum : 0;
    const grossRevenuePerHour = minutesNum > 0 ? (valueNum / minutesNum) * 60 : 0;

    const kmCost = kmNum * DEFAULT_COST_PER_KM;
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
  }, [value, km, minutes]);

  const handleSave = useCallback(async () => {
    const valueNum = parseFloat(value);
    const kmNum = parseFloat(km) || 0;
    const minutesNum = parseFloat(minutes) || 0;

    if (!valueNum || valueNum <= 0) {
      toast.error('Informe o valor da corrida');
      return;
    }

    setIsSaving(true);

    try {
      await addGuestEntry({
        type: 'earning',
        amount: valueNum,
        km: kmNum > 0 ? kmNum : undefined,
        minutes: minutesNum > 0 ? minutesNum : undefined,
        platform_name: platformName,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Track earning added
      trackDemoEntryAdded('earning', { amount: valueNum, platform: platformName });

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
  }, [value, km, minutes, platformName, addGuestEntry, trackDemoEntryAdded]);

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Guest mode banner */}
      <GuestModeBanner />
      
      {/* Signup prompt modal */}
      <SignupPromptModal />
      
      {/* Progress nudge - appears after 2 entries */}
      <DemoProgressNudge />
      
      {/* Exit intent detection */}
      <DemoExitIntent />

      {/* Content with top padding for banner */}
      <div className="pt-12 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto scroll-momentum">
        {/* Header - matching QuickEntry style exactly */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-profit flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Entrada Rápida</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Registre e analise instantaneamente</p>
          </div>
        </div>

        {/* Social proof - subtle, non-intrusive */}
        <DemoSocialProof />

        {/* Quick Metrics Display - Real-time */}
        <DemoQuickMetrics
          grossRevenuePerKm={liveMetrics.grossRevenuePerKm}
          grossRevenuePerHour={liveMetrics.grossRevenuePerHour}
          netRevenuePerKm={liveMetrics.netRevenuePerKm}
          netRevenuePerHour={liveMetrics.netRevenuePerHour}
          kmCost={liveMetrics.kmCost}
          costPerKm={DEFAULT_COST_PER_KM}
          hasData={liveMetrics.hasData}
        />

        {/* Input Form - matching QuickEntry style */}
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

          <DemoQuickEntryForm
            value={value}
            km={km}
            minutes={minutes}
            platformName={platformName}
            isSaving={isSaving}
            onValueChange={setValue}
            onKmChange={setKm}
            onMinutesChange={setMinutes}
            onPlatformChange={setPlatformName}
            onSave={handleSave}
          />
        </div>

        {/* Tips */}
        <div className="text-center text-2xs sm:text-xs text-muted-foreground">
          <p>💡 Preencha km e tempo para calcular suas métricas</p>
        </div>

        {/* CTA to signup */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm text-center text-muted-foreground mb-3">
            Gostou? Crie sua conta grátis para salvar seus dados
          </p>
          <Button
            asChild
            className="w-full h-12 bg-gradient-profit hover:opacity-90 font-semibold"
            onClick={() => trackDemoToAuth('cta')}
          >
            <Link to="/auth?signup=true" state={{ fromDemo: true }}>
              Criar conta grátis
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
