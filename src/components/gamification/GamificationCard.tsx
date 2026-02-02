import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { Flame, Trophy, Target, ChevronRight, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function GamificationCard() {
  const { stats, weeklyProgress, weeklyGoals, isLoading, xpProgress, unlockedAchievements } = useGamification();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const weeklyEarningsProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.earnings / weeklyGoals.earnings) * 100) 
    : 0;

  const weeklyServicesProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.services / weeklyGoals.services) * 100) 
    : 0;

  return (
    <Link to="/achievements">
      <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
        <CardContent className="p-4">
          {/* Header with Level and Streak */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Level Badge */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-primary-foreground">{stats.level}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <Zap className="w-3 h-3 text-accent-foreground" />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground">Nível {stats.level}</p>
                <p className="text-xs text-muted-foreground">{stats.xp} XP</p>
              </div>
            </div>

            {/* Streak */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              stats.currentStreak > 0 
                ? "bg-orange-500/20 text-orange-500" 
                : "bg-muted text-muted-foreground"
            )}>
              <Flame className={cn(
                "w-4 h-4",
                stats.currentStreak > 0 && "animate-pulse"
              )} />
              <span className="text-sm font-bold">{stats.currentStreak}</span>
              <span className="text-xs">dias</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso para nível {stats.level + 1}</span>
              <span>{Math.round(xpProgress)}%</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>

          {/* Weekly Goals Mini */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-background/50 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Meta Semanal</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">
                  R$ {weeklyProgress?.earnings.toFixed(0) || 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {weeklyGoals.earnings}
                </span>
              </div>
              <Progress value={weeklyEarningsProgress} className="h-1 mt-1" />
            </div>

            <div className="bg-background/50 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3 h-3 text-accent" />
                <span className="text-xs text-muted-foreground">Conquistas</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">
                  {unlockedAchievements.length}
                </span>
                <span className="text-xs text-muted-foreground">
                  desbloqueadas
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
            <span>Ver todas as conquistas</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
