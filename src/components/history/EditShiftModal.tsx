import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Clock, Navigation, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useUpdateShift } from '@/hooks/useShifts';
import { Shift } from '@/types/database';

const schema = z.object({
  date: z.date(),
  platform_id: z.string().min(1, 'Selecione uma plataforma'),
  hours_worked: z.number().min(0, 'Horas devem ser maior ou igual a zero'),
  km_driven: z.number().min(0, 'Km deve ser maior ou igual a zero'),
});

type FormData = z.infer<typeof schema>;

interface EditShiftModalProps {
  shift: Shift | null;
  open: boolean;
  onClose: () => void;
}

export function EditShiftModal({ shift, open, onClose }: EditShiftModalProps) {
  const { data: platforms } = usePlatforms();
  const updateShift = useUpdateShift();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (shift) {
      reset({
        date: parseISO(shift.date),
        platform_id: shift.platform_id || '',
        hours_worked: Number(shift.hours_worked),
        km_driven: Number(shift.km_driven),
      });
    }
  }, [shift, reset]);

  const date = watch('date');

  const onSubmit = async (data: FormData) => {
    if (!shift) return;
    
    await updateShift.mutateAsync({
      id: shift.id,
      platform_id: data.platform_id,
      hours_worked: data.hours_worked,
      km_driven: data.km_driven,
      date: format(data.date, 'yyyy-MM-dd'),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Turno</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
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
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select 
              value={watch('platform_id')} 
              onValueChange={(v) => setValue('platform_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {platforms?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform_id && (
              <p className="text-xs text-destructive">{errors.platform_id.message}</p>
            )}
          </div>

          {/* Hours & KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Horas</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  className="pl-9 font-mono"
                  {...register('hours_worked', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Km Rodados</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  className="pl-9 font-mono"
                  {...register('km_driven', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateShift.isPending}
            >
              {updateShift.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
