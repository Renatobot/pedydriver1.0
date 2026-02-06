import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/formatters';

const NUDGE_SESSION_KEY = 'pedy_demo_nudge_shown';
const NUDGE_TRIGGER_COUNT = 2;
const AUTO_DISMISS_MS = 15000;

export function DemoProgressNudge() {
  const navigate = useNavigate();
  const { guestEntryCount, totalEarnings, totalExpenses, triggerSignupModal } = useGuestMode();
  const { trackDemoNudgeShown, trackDemoNudgeClicked, trackDemoNudgeDismissed, trackDemoToAuth } = useAnalytics();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Check if nudge was already shown this session
  useEffect(() => {
    const wasShown = sessionStorage.getItem(NUDGE_SESSION_KEY);
    if (wasShown) {
      setHasShown(true);
    }
  }, []);

  // Trigger nudge when user has 2+ entries
  useEffect(() => {
    if (guestEntryCount >= NUDGE_TRIGGER_COUNT && !hasShown && !isVisible) {
      // Delay a bit so it doesn't feel jarring
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem(NUDGE_SESSION_KEY, 'true');
        trackDemoNudgeShown();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [guestEntryCount, hasShown, isVisible, trackDemoNudgeShown]);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    trackDemoNudgeDismissed();
  };

  const handleSaveClick = () => {
    setIsVisible(false);
    trackDemoNudgeClicked();
    trackDemoToAuth('nudge');
    triggerSignupModal('Salve seus registros');
  };

  const totalValue = totalEarnings + totalExpenses;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="relative bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 shadow-2xl shadow-primary/30">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-primary-foreground" />
            </button>

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-primary-foreground">
                  Você já registrou {formatCurrency(totalValue)}!
                </h3>
                <p className="text-sm text-primary-foreground/80 mt-0.5">
                  Salve seus dados em 30 segundos para não perder
                </p>

                {/* CTA buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-white/90 font-semibold"
                    onClick={handleSaveClick}
                  >
                    Salvar meus dados
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    Continuar testando
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left rounded-b-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
