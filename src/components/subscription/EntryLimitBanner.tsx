import { AlertCircle, Crown } from 'lucide-react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EntryLimitBannerProps {
  className?: string;
}

export function EntryLimitBanner({ className }: EntryLimitBannerProps) {
  const { isPro, monthlyEntryCount, limits, remainingEntries } = useSubscriptionContext();

  if (isPro) return null;

  const percentage = (monthlyEntryCount / limits.maxEntriesPerMonth) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remainingEntries === 0;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <div className={cn(
      'rounded-xl p-3 flex items-center justify-between gap-3',
      isAtLimit 
        ? 'bg-destructive/10 border border-destructive/20' 
        : 'bg-amber-500/10 border border-amber-500/20',
      className
    )}>
      <div className="flex items-center gap-2.5">
        <AlertCircle className={cn(
          'w-4 h-4 flex-shrink-0',
          isAtLimit ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
        )} />
        <span className="text-sm">
          {isAtLimit 
            ? 'Você atingiu o limite de registros do mês' 
            : `${remainingEntries} registros restantes este mês`
          }
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="flex-shrink-0 text-xs">
        <Link to="/upgrade">
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
        </Link>
      </Button>
    </div>
  );
}

// Compact counter for header/sidebar
export function EntryCounter({ className }: { className?: string }) {
  const { isPro, monthlyEntryCount, limits } = useSubscriptionContext();

  if (isPro) return null;

  const percentage = (monthlyEntryCount / limits.maxEntriesPerMonth) * 100;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
        <div 
          className={cn(
            'h-full rounded-full transition-all',
            percentage >= 90 ? 'bg-destructive' : 
            percentage >= 70 ? 'bg-amber-500' : 
            'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-muted-foreground whitespace-nowrap">
        {monthlyEntryCount}/{limits.maxEntriesPerMonth}
      </span>
    </div>
  );
}
