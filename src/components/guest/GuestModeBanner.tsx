import { Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/formatters';

export function GuestModeBanner() {
  const { triggerSignupModal, guestEntryCount, totalEarnings, totalExpenses } = useGuestMode();
  const { trackDemoCTAClick } = useAnalytics();

  const handleSaveClick = () => {
    trackDemoCTAClick('banner_save_data');
    triggerSignupModal('Clicou em salvar dados');
  };

  const totalValue = totalEarnings + totalExpenses;
  const hasValue = totalValue > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="font-medium">Dados temporários</span>
            {hasValue && (
              <>
                <span className="text-white/60">•</span>
                <span className="font-bold">{formatCurrency(totalValue)}</span>
              </>
            )}
            {!hasValue && guestEntryCount > 0 && (
              <>
                <span className="text-white/60">•</span>
                <span>{guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="secondary"
          className="bg-white text-amber-600 hover:bg-white/90 font-bold text-xs h-8 px-3 flex-shrink-0 shadow-md"
          onClick={handleSaveClick}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Criar conta
        </Button>
      </div>
    </div>
  );
}
