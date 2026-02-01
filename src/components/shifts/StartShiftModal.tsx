import { useState } from 'react';
import { Play, Navigation, Car } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useActiveShift } from '@/hooks/useActiveShift';

interface StartShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartShiftModal({ open, onOpenChange }: StartShiftModalProps) {
  const { data: platforms } = usePlatforms();
  const { startShift, isStarting } = useActiveShift();
  
  const [platformId, setPlatformId] = useState('');
  const [startKm, setStartKm] = useState('');

  const handleStart = async () => {
    const kmNum = parseFloat(startKm);
    
    if (!platformId) {
      return;
    }
    
    if (isNaN(kmNum) || kmNum < 0) {
      return;
    }
    
    try {
      await startShift({
        platform_id: platformId,
        start_km: kmNum,
      });
      
      // Reset and close
      setPlatformId('');
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
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select value={platformId} onValueChange={setPlatformId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platforms?.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="py-3">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={isStarting || !platformId || !startKm}
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
