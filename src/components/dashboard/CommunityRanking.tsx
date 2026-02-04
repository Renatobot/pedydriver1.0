import { Trophy, Users, Lock } from 'lucide-react';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Link } from 'react-router-dom';

export function CommunityRanking() {
  const { userRankings, hasEnoughData, isLoading } = useCommunityStats();
  const { isPro } = useSubscriptionContext();

  if (isLoading) return null;

  // Hide completely if no community data yet
  if (!hasEnoughData) {
    return null;
  }

  // PRO feature gate
  if (!isPro) {
    return (
      <Link to="/upgrade" className="block">
        <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm text-foreground">Ranking da Comunidade</span>
            <Lock className="w-3 h-3 text-amber-500 ml-auto" />
          </div>
          <p className="text-xs text-muted-foreground">
            Compare seu desempenho com outros motoristas. Exclusivo PRO.
          </p>
        </div>
      </Link>
    );
  }

  // Hide if no ranking data available
  if (!userRankings || userRankings.length === 0) {
    return null;
  }

  // Show top 2 rankings
  const topRankings = userRankings.slice(0, 2);

  return (
    <div className="rounded-xl p-4 bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="font-medium text-sm text-foreground">Seu Ranking</span>
        <span className="text-2xs text-muted-foreground ml-auto">vs comunidade</span>
      </div>

      <div className="space-y-3">
        {topRankings.map((ranking) => {
          const isTopPerformer = ranking.percentile >= 75;
          
          return (
            <div key={ranking.metric} className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                isTopPerformer 
                  ? "bg-amber-500/20" 
                  : "bg-secondary"
              )}>
                {ranking.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {ranking.label}
                  </span>
                  {isTopPerformer && (
                    <span className="text-2xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                      Top {100 - ranking.percentile}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {ranking.description}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "font-mono text-sm font-semibold",
                  isTopPerformer ? "text-amber-500" : "text-foreground"
                )}>
                  {ranking.metric.includes('hour') || ranking.metric.includes('km') 
                    ? formatCurrency(ranking.userValue)
                    : formatCurrency(ranking.userValue)
                  }
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
