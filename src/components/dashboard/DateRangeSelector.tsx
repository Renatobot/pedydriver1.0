import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DateRange } from '@/hooks/useDashboard';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const { canAccess } = useSubscriptionContext();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'weeklyView' | 'monthlyView'>('weeklyView');

  const canAccessWeek = canAccess('weeklyView');
  const canAccessMonth = canAccess('monthlyView');

  const handleRangeClick = (newRange: DateRange) => {
    if (newRange === 'week' && !canAccessWeek) {
      setUpgradeFeature('weeklyView');
      setUpgradeModalOpen(true);
      return;
    }
    if (newRange === 'month' && !canAccessMonth) {
      setUpgradeFeature('monthlyView');
      setUpgradeModalOpen(true);
      return;
    }
    onChange(newRange);
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-secondary">
        <button
          onClick={() => handleRangeClick('day')}
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
          onClick={() => handleRangeClick('week')}
          className={cn(
            'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px] relative',
            value === 'week' 
              ? 'bg-card text-foreground shadow-sm' 
              : canAccessWeek 
                ? 'text-muted-foreground hover:text-foreground active:text-foreground'
                : 'text-muted-foreground/50 cursor-default'
          )}
        >
          Semana
          {!canAccessWeek && (
            <PremiumBadge className="absolute -top-1 -right-1" size="sm" />
          )}
        </button>
        <button
          onClick={() => handleRangeClick('month')}
          className={cn(
            'flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px] relative',
            value === 'month' 
              ? 'bg-card text-foreground shadow-sm' 
              : canAccessMonth 
                ? 'text-muted-foreground hover:text-foreground active:text-foreground'
                : 'text-muted-foreground/50 cursor-default'
          )}
        >
          Mês
          {!canAccessMonth && (
            <PremiumBadge className="absolute -top-1 -right-1" size="sm" />
          )}
        </button>
      </div>

      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen}
        feature={upgradeFeature}
      />
    </>
  );
}
