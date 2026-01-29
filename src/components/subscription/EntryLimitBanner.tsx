import { AlertCircle, Crown, TrendingUp } from 'lucide-react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface EntryLimitBannerProps {
  className?: string;
  showAlways?: boolean;
}

export function EntryLimitBanner({ className, showAlways = false }: EntryLimitBannerProps) {
  const { isPro, monthlyEntryCount, limits, remainingEntries } = useSubscriptionContext();

  if (isPro) return null;

  const percentage = (monthlyEntryCount / limits.maxEntriesPerMonth) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remainingEntries === 0;

  // Only show when at limit or near limit, unless showAlways is true
  if (!showAlways && !isNearLimit && !isAtLimit) return null;

  return (
    <div className={cn(
      'rounded-xl p-3 sm:p-4 space-y-2',
      isAtLimit 
        ? 'bg-destructive/10 border border-destructive/20' 
        : isNearLimit
        ? 'bg-amber-500/10 border border-amber-500/20'
        : 'bg-muted/50 border border-border',
      className
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isAtLimit || isNearLimit ? (
            <AlertCircle className={cn(
              'w-4 h-4 flex-shrink-0',
              isAtLimit ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
            )} />
          ) : (
            <TrendingUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          )}
          <span className={cn(
            'text-sm font-medium',
            isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
          )}>
            {isAtLimit 
              ? 'Limite atingido' 
              : isNearLimit
              ? `${remainingEntries} registros restantes`
              : `${monthlyEntryCount} de ${limits.maxEntriesPerMonth} registros`
            }
          </span>
        </div>
        <Button asChild size="sm" variant={isAtLimit ? 'default' : 'outline'} className="flex-shrink-0 text-xs">
          <Link to="/upgrade">
            <Crown className="w-3 h-3 mr-1" />
            {isAtLimit ? 'Upgrade' : 'PRO'}
          </Link>
        </Button>
      </div>
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className={cn(
          'h-1.5',
          isAtLimit ? '[&>div]:bg-destructive' : 
          isNearLimit ? '[&>div]:bg-amber-500' : 
          '[&>div]:bg-primary'
        )}
      />
      
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-muted-foreground">
          Você está chegando ao limite do plano gratuito.
        </p>
      )}
      
      {isAtLimit && (
        <p className="text-xs text-muted-foreground">
          Você atingiu o limite de registros do mês. Faça upgrade para continuar.
        </p>
      )}
    </div>
  );
}

// Compact indicator for header
export function EntryLimitIndicator({ className }: { className?: string }) {
  const { isPro, monthlyEntryCount, limits } = useSubscriptionContext();

  if (isPro) return null;

  const percentage = (monthlyEntryCount / limits.maxEntriesPerMonth) * 100;

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
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
      <span className={cn(
        'text-xs font-medium whitespace-nowrap',
        percentage >= 90 ? 'text-destructive' : 
        percentage >= 70 ? 'text-amber-600 dark:text-amber-400' : 
        'text-muted-foreground'
      )}>
        {monthlyEntryCount}/{limits.maxEntriesPerMonth}
      </span>
    </div>
  );
}

// Legacy compact counter (deprecated, use EntryLimitIndicator instead)
export function EntryCounter({ className }: { className?: string }) {
  return <EntryLimitIndicator className={className} />;
}
