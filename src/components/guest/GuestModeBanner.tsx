import { Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';

export function GuestModeBanner() {
  const { triggerSignupModal, guestEntryCount } = useGuestMode();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Modo Visitante</p>
            {guestEntryCount > 0 && (
              <p className="text-xs text-white/80 truncate">
                {guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''} local
              </p>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="secondary"
          className="bg-white text-amber-600 hover:bg-white/90 font-semibold text-xs h-8 px-3 flex-shrink-0"
          onClick={() => triggerSignupModal()}
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          Salvar dados
        </Button>
      </div>
    </div>
  );
}
