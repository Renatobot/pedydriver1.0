import { cn } from '@/lib/utils';
import { DateRange } from '@/hooks/useDashboard';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-secondary">
      <button
        onClick={() => onChange('day')}
        className={cn(
          'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px]',
          value === 'day' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        Hoje
      </button>
      <button
        onClick={() => onChange('week')}
        className={cn(
          'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px]',
          value === 'week' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        Semana
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px]',
          value === 'month' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        Mês
      </button>
    </div>
  );
}
