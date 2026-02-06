import { memo } from 'react';
import { DollarSign, Navigation, Clock, TrendingUp, Car, Bike } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { name: 'Uber', color: 'bg-black', icon: Car },
  { name: '99', color: 'bg-yellow-500', icon: Car },
  { name: 'iFood', color: 'bg-red-500', icon: Bike },
  { name: 'Rappi', color: 'bg-orange-500', icon: Bike },
];

interface DemoQuickEntryFormProps {
  value: string;
  km: string;
  minutes: string;
  platformName: string;
  isSaving: boolean;
  onValueChange: (value: string) => void;
  onKmChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onSave: () => void;
}

export const DemoQuickEntryForm = memo(function DemoQuickEntryForm({
  value,
  km,
  minutes,
  platformName,
  isSaving,
  onValueChange,
  onKmChange,
  onMinutesChange,
  onPlatformChange,
  onSave,
}: DemoQuickEntryFormProps) {
  return (
    <div>
      {/* Platform selector */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <Label className="text-xs sm:text-sm text-muted-foreground">Plataforma</Label>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isSelected = platformName === platform.name;
            return (
              <button
                key={platform.name}
                type="button"
                onClick={() => onPlatformChange(platform.name)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/50 hover:border-primary/50'
                )}
              >
                <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center', platform.color)}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-2xs sm:text-xs font-medium">{platform.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Value - Main input */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <Label className="text-xs sm:text-sm text-muted-foreground">Valor da Corrida</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="pl-10 sm:pl-12 h-14 sm:h-16 text-xl sm:text-2xl font-mono font-bold text-center"
          />
        </div>
      </div>

      {/* KM and Time - Side by side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm text-muted-foreground">Km Rodados</Label>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="0"
              value={km}
              onChange={(e) => onKmChange(e.target.value)}
              className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm text-muted-foreground">Tempo (min)</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              placeholder="0"
              value={minutes}
              onChange={(e) => onMinutesChange(e.target.value)}
              className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={onSave}
        disabled={isSaving || !value}
        className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-profit hover:opacity-90 transition-opacity touch-feedback"
      >
        {isSaving ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Salvando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Registrar Corrida
          </div>
        )}
      </Button>
    </div>
  );
});
