import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/formatters';

const EXIT_INTENT_SESSION_KEY = 'pedy_demo_exit_intent_shown';

export function DemoExitIntent() {
  const { guestEntryCount, totalEarnings, totalExpenses, netProfit, triggerSignupModal } = useGuestMode();
  const { trackDemoExitIntentShown, trackDemoExitIntentClicked, trackDemoExitIntentDismissed, trackDemoToAuth } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Check if exit intent was already shown this session
  useEffect(() => {
    const wasShown = sessionStorage.getItem(EXIT_INTENT_SESSION_KEY);
    if (wasShown) {
      setHasShown(true);
    }
  }, []);

  const showExitIntent = useCallback(() => {
    if (hasShown || guestEntryCount === 0) return;
    
    setIsOpen(true);
    setHasShown(true);
    sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, 'true');
    trackDemoExitIntentShown();
  }, [hasShown, guestEntryCount, trackDemoExitIntentShown]);

  // Desktop: detect mouse leaving viewport from top
  useEffect(() => {
    if (hasShown || guestEntryCount === 0) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top
      if (e.clientY <= 0) {
        showExitIntent();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, guestEntryCount, showExitIntent]);

  // Mobile: detect tab switching or app backgrounding
  useEffect(() => {
    if (hasShown || guestEntryCount === 0) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't show modal when tab is hidden, but mark as triggered
        // so we can show it when they come back
        sessionStorage.setItem('pedy_demo_exit_pending', 'true');
      } else if (document.visibilityState === 'visible') {
        const pending = sessionStorage.getItem('pedy_demo_exit_pending');
        if (pending && !hasShown) {
          sessionStorage.removeItem('pedy_demo_exit_pending');
          showExitIntent();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasShown, guestEntryCount, showExitIntent]);

  const handleSave = () => {
    setIsOpen(false);
    trackDemoExitIntentClicked();
    trackDemoToAuth('exit_intent');
    triggerSignupModal('Salve seus dados antes de sair');
  };

  const handleClose = () => {
    setIsOpen(false);
    trackDemoExitIntentDismissed();
  };

  const totalValue = totalEarnings + totalExpenses;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          {/* Warning icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <DialogTitle className="text-xl font-bold">
            Quer salvar seus {formatCurrency(totalValue)}?
          </DialogTitle>

          <DialogDescription className="text-base text-muted-foreground">
            Seus registros serão perdidos se você sair sem criar uma conta.
          </DialogDescription>
        </DialogHeader>

        {/* Summary of data */}
        {guestEntryCount > 0 && (
          <div className="my-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Ganhos</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-sm font-semibold text-red-500">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''} serão salvos
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-12 bg-gradient-profit hover:opacity-90 font-bold"
            onClick={handleSave}
          >
            Salvar agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            onClick={handleClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Não, pode perder
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
