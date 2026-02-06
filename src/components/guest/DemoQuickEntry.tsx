import { useState } from 'react';
import { Check, Car, Bike, DollarSign, Clock, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PLATFORMS = [
  { name: 'Uber', color: 'bg-black', icon: Car },
  { name: '99', color: 'bg-yellow-500', icon: Car },
  { name: 'iFood', color: 'bg-red-500', icon: Bike },
  { name: 'Rappi', color: 'bg-orange-500', icon: Bike },
];

const QUICK_AMOUNTS = [20, 50, 100, 150];

export function DemoQuickEntry() {
  const { addGuestEntry, triggerSignupModal } = useGuestMode();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Uber');
  const [amount, setAmount] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addGuestEntry({
        type: 'earning',
        amount: numAmount,
        km: km ? parseFloat(km) : undefined,
        minutes: minutes ? parseFloat(minutes) : undefined,
        platform_name: selectedPlatform,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Show success animation
      setShowSuccess(true);
      
      // Reset form
      setAmount('');
      setKm('');
      setMinutes('');
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving guest entry:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 relative overflow-hidden">
      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-primary/95 flex items-center justify-center z-10 animate-fade-in">
          <div className="text-center text-primary-foreground">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8" />
            </div>
            <p className="text-xl font-bold">Registrado! 🎉</p>
            <p className="text-sm opacity-90 mt-1">Veja as métricas abaixo</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Platform selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Plataforma</Label>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatform === platform.name;
              return (
                <button
                  key={platform.name}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.name)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/50 hover:border-primary/50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', platform.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quanto você ganhou?</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 h-14 text-2xl font-bold text-center"
              step="0.01"
              min="0"
            />
          </div>
          
          {/* Quick amount buttons */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  amount === value.toString()
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                R$ {value}
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              KM rodados (opcional)
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="h-10"
              step="0.1"
              min="0"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Minutos (opcional)
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="h-10"
              min="0"
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 bg-gradient-profit hover:opacity-90 text-base font-bold"
          disabled={isSubmitting || !amount}
        >
          {isSubmitting ? 'Registrando...' : 'Registrar ganho'}
        </Button>
      </form>
    </Card>
  );
}
