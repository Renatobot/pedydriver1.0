import { memo } from 'react';
import { DollarSign, Navigation, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Platform } from '@/types/database';

interface QuickEntryFormProps {
  platforms: Platform[] | undefined;
  value: string;
  km: string;
  minutes: string;
  platformId: string;
  isSaving: boolean;
  isBlocked: boolean;
  onValueChange: (value: string) => void;
  onKmChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onSave: () => void;
}

export const QuickEntryForm = memo(function QuickEntryForm({
  platforms,
  value,
  km,
  minutes,
  platformId,
  isSaving,
  isBlocked,
  onValueChange,
  onKmChange,
  onMinutesChange,
  onPlatformChange,
  onSave,
}: QuickEntryFormProps) {
  return (
    <div className={cn(isBlocked && 'opacity-50 pointer-events-none')}>
      {/* Platform */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <Label className="text-xs sm:text-sm text-muted-foreground">Plataforma</Label>
        <Select value={platformId} onValueChange={onPlatformChange}>
          <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
            <SelectValue placeholder="Selecione" />
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
        disabled={isSaving || !value || !platformId || isBlocked}
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
