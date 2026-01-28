import { cn } from '@/lib/utils';
import { DateRange } from '@/hooks/useDashboard';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
      <button
        onClick={() => onChange('week')}
        className={cn(
          'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
          value === 'week' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Semana
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
          value === 'month' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Mês
      </button>
    </div>
  );
}
