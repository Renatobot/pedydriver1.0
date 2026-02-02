import { useState, useEffect } from 'react';
import { Clock, Navigation, X, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveShift } from '@/hooks/useActiveShift';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';
import { EndShiftModal } from './EndShiftModal';

export function ActiveShiftBanner() {
  const { activeShift, hasActiveShift, getDuration, cancelShift, isCancelling } = useActiveShift();
  const [duration, setDuration] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);

  // Atualizar duração a cada minuto
  useEffect(() => {
    if (!hasActiveShift) return;
    
    setDuration(getDuration());
    const interval = setInterval(() => {
      setDuration(getDuration());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [hasActiveShift, getDuration]);

  if (!hasActiveShift || !activeShift) return null;

  return (
    <>
      <div className={cn(
        "relative rounded-2xl p-3 sm:p-4",
        "bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10",
        "border border-primary/30",
        "animate-pulse-subtle"
      )}>
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse opacity-50" />
        
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated clock icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  Turno ativo
                </span>
                <span className="text-xs sm:text-sm font-mono font-bold text-primary">
                  {duration}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                {activeShift.platforms && activeShift.platforms.length > 0 && (
                  <span>{activeShift.platforms.map(p => p.name).join(', ')}</span>
                )}
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {formatNumber(activeShift.start_km, 0)} km inicial
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelShift()}
              disabled={isCancelling}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowEndModal(true)}
              className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm bg-primary hover:bg-primary/90"
            >
              <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      <EndShiftModal 
        open={showEndModal} 
        onOpenChange={setShowEndModal}
        startKm={activeShift.start_km}
      />
    </>
  );
}
