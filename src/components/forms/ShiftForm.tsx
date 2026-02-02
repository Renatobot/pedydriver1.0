import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Navigation, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateShiftOffline } from '@/hooks/useOfflineShifts';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { EntryLimitBlocker } from '@/components/subscription/EntryLimitBlocker';

const schema = z.object({
  date: z.date(),
  platform_ids: z.array(z.string()).min(1, 'Selecione ao menos uma plataforma'),
  hours_worked: z.number().min(0, 'Horas devem ser maior ou igual a zero'),
  km_driven: z.number().min(0, 'Km deve ser maior ou igual a zero'),
});

type FormData = z.infer<typeof schema>;

interface ShiftFormProps {
  onSuccess?: () => void;
}

export function ShiftForm({ onSuccess }: ShiftFormProps) {
  const { data: platforms } = usePlatforms();
  const createShift = useCreateShiftOffline();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { canAddEntry, isPro } = useSubscriptionContext();
  const [showBlocker, setShowBlocker] = useState(!canAddEntry);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      platform_ids: [],
      hours_worked: 0,
      km_driven: 0,
    }
  });

  const date = watch('date');
  const selectedPlatforms = watch('platform_ids') || [];
  const isBlocked = !canAddEntry && !isPro;
  
  // Use mutation state to prevent double submissions
  const isBusy = isSubmitting || createShift.isPending;

  const togglePlatform = (platformId: string) => {
    const current = selectedPlatforms;
    const updated = current.includes(platformId)
      ? current.filter(id => id !== platformId)
      : [...current, platformId];
    setValue('platform_ids', updated);
  };

  const onSubmit = async (data: FormData) => {
    if (isBlocked) {
      setShowBlocker(true);
      return;
    }
    
    // Prevent double submission
    if (createShift.isPending) {
      return;
    }
    
    // Create ONE shift with all platforms selected
    const shiftData = {
      platform_id: data.platform_ids[0], // First for backwards compatibility
      platform_ids: data.platform_ids,
      hours_worked: data.hours_worked,
      km_driven: data.km_driven,
      date: format(data.date, 'yyyy-MM-dd'),
    };
    
    await createShift.mutateAsync(shiftData);
    reset();
    onSuccess?.();
  };

  return (
    <div className="relative">
      {isBlocked && showBlocker && (
        <EntryLimitBlocker onContinueViewing={() => setShowBlocker(false)} />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-3 sm:space-y-4', isBlocked && 'opacity-50 pointer-events-none')}>
        {/* Date */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Data</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-11 sm:h-12 text-sm sm:text-base',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd/MM/yyyy') : 'Selecione'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) setValue('date', d);
                  setCalendarOpen(false);
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Platform - Multiple Selection */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Plataformas (selecione todas que usou)</Label>
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
          {errors.platform_ids && (
            <p className="text-2xs sm:text-xs text-destructive">{errors.platform_ids.message}</p>
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

        {/* Hours & KM */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Horas</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
                {...register('hours_worked', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Km Rodados</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
                {...register('km_driven', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 sm:h-12 text-sm sm:text-base touch-feedback" 
          disabled={isBusy || isBlocked}
        >
          {isBusy ? 'Salvando...' : 'Registrar Turno'}
        </Button>
      </form>
    </div>
  );
}
