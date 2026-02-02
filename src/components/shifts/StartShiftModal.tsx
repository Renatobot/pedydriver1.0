import { useState } from 'react';
import { Play, Navigation, Car, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useActiveShift } from '@/hooks/useActiveShift';
import { cn } from '@/lib/utils';

interface StartShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartShiftModal({ open, onOpenChange }: StartShiftModalProps) {
  const { data: platforms } = usePlatforms();
  const { startShift, isStarting } = useActiveShift();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [startKm, setStartKm] = useState('');

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
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
            <Label>Plataformas (selecione todas que vai usar)</Label>
            <div className="grid grid-cols-2 gap-2">
              {platforms?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all touch-feedback",
                    selectedPlatforms.includes(p.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    selectedPlatforms.includes(p.id)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  )}>
                    {selectedPlatforms.includes(p.id) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </button>
              ))}
            </div>
            {selectedPlatforms.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedPlatforms.length} plataforma{selectedPlatforms.length > 1 ? 's' : ''} selecionada{selectedPlatforms.length > 1 ? 's' : ''}
              </p>
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
