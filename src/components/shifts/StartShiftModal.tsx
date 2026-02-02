import { useState } from 'react';
import { Play, Navigation, Car, Check, Info, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useActiveShift } from '@/hooks/useActiveShift';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface StartShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartShiftModal({ open, onOpenChange }: StartShiftModalProps) {
  const { data: platforms } = usePlatforms();
  const { startShift, isStarting } = useActiveShift();
  const { canUsePlatform, limits, isPro } = useSubscriptionContext();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [startKm, setStartKm] = useState('');

  const togglePlatform = (platformId: string) => {
    // IMPORTANT: enforce limits inside the state updater to avoid race conditions
    // when the user taps quickly on multiple platforms.
    setSelectedPlatforms((prev) => {
      // If already selected, toggle off
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId);
      }

      // Free plan: only up to maxPlatforms selected at once
      if (!isPro && prev.length >= limits.maxPlatforms) {
        return prev;
      }

      // If platform is not allowed (based on historical usage), don't add it
      if (!canUsePlatform(platformId)) {
        return prev;
      }

      return [...prev, platformId];
    });
  };
  
  // Check if platform is locked (can't be used)
  const isPlatformLocked = (platformId: string): boolean => {
    if (isPro) return false;
    if (selectedPlatforms.includes(platformId)) return false;
    // If already at limit in current selection
    if (selectedPlatforms.length >= limits.maxPlatforms) return true;
    // If can't use this platform based on history
    return !canUsePlatform(platformId);
  };

  const handleStart = async () => {
    const kmNum = parseFloat(startKm);
    
    if (selectedPlatforms.length === 0) {
      return;
    }
    
    if (isNaN(kmNum) || kmNum < 0) {
      return;
    }
    
    try {
      await startShift({
        platform_ids: selectedPlatforms,
        start_km: kmNum,
      });
      
      // Reset and close
      setSelectedPlatforms([]);
      setStartKm('');
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            Iniciar Turno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection - Multiple */}
          <div className="space-y-2">
            <Label>
              {isPro ? 'Plataformas (selecione todas que vai usar)' : `Plataforma (limite: ${limits.maxPlatforms})`}
            </Label>
            
            {!isPro && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-2">
                <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No plano grátis, você pode usar apenas {limits.maxPlatforms} plataforma por vez. Faça upgrade para usar múltiplas!
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {platforms?.map((p) => {
                const locked = isPlatformLocked(p.id);
                const selected = selectedPlatforms.includes(p.id);
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    disabled={locked}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-all",
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : locked
                          ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50 touch-feedback"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      selected
                        ? "bg-primary border-primary"
                        : locked
                          ? "border-muted-foreground/20 bg-muted"
                          : "border-muted-foreground/30"
                    )}>
                      {selected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                      {locked && !selected && (
                        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedPlatforms.length} plataforma{selectedPlatforms.length > 1 ? 's' : ''} selecionada{selectedPlatforms.length > 1 ? 's' : ''}
              </p>
            )}
            {selectedPlatforms.length > 1 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Ao usar múltiplas plataformas simultaneamente, não será possível identificar qual é a mais rentável individualmente nos relatórios.
                </p>
              </div>
            )}
          </div>

          {/* Start KM */}
          <div className="space-y-2">
            <Label>Km Atual do Odômetro</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="Ex: 45230"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                className="pl-11 h-14 text-xl font-mono font-bold text-center"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Informe a quilometragem atual do veículo
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting || selectedPlatforms.length === 0 || !startKm}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isStarting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Iniciando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Iniciar Turno
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
