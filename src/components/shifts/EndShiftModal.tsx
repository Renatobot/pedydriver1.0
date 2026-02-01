import { useState, useMemo } from 'react';
import { Square, Navigation, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveShift } from '@/hooks/useActiveShift';
import { formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface EndShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startKm: number;
}

export function EndShiftModal({ open, onOpenChange, startKm }: EndShiftModalProps) {
  const { endShift, isEnding, getDuration } = useActiveShift();
  const [endKm, setEndKm] = useState('');

  const kmDriven = useMemo(() => {
    const endKmNum = parseFloat(endKm);
    if (isNaN(endKmNum) || endKmNum < startKm) return 0;
    return endKmNum - startKm;
  }, [endKm, startKm]);

  const handleEnd = async () => {
    const endKmNum = parseFloat(endKm);
    
    if (isNaN(endKmNum) || endKmNum < startKm) {
      return;
    }
    
    try {
      await endShift(endKmNum);
      setEndKm('');
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
              <Square className="w-4 h-4 text-primary" />
            </div>
            Finalizar Turno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Km Inicial</p>
              <p className="text-lg font-mono font-bold">{formatNumber(startKm, 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Duração</p>
              <p className="text-lg font-mono font-bold text-primary">{getDuration()}</p>
            </div>
          </div>

          {/* End KM */}
          <div className="space-y-2">
            <Label>Km Final do Odômetro</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={startKm}
                placeholder={`Maior que ${formatNumber(startKm, 0)}`}
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="pl-11 h-14 text-xl font-mono font-bold text-center"
              />
            </div>
          </div>

          {/* Calculated KM */}
          <div className={cn(
            "p-4 rounded-xl border text-center transition-all",
            kmDriven > 0 
              ? "bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30" 
              : "bg-muted/30 border-border/50"
          )}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className={cn(
                "w-4 h-4",
                kmDriven > 0 ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">Km Rodados</span>
            </div>
            <p className={cn(
              "text-2xl font-mono font-bold transition-all",
              kmDriven > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {kmDriven > 0 ? formatNumber(kmDriven, 1) : '—'}
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
            onClick={handleEnd}
            disabled={isEnding || kmDriven <= 0}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isEnding ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Finalizando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Finalizar
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
