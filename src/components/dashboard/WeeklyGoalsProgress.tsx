import { Target, TrendingUp, Navigation, Clock, Hash } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface GoalItemProps {
  label: string;
  current: number;
  goal: number;
  format: 'currency' | 'number' | 'hours' | 'km';
  icon: React.ReactNode;
}

function GoalItem({ label, current, goal, format, icon }: GoalItemProps) {
  const percentage = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'hours':
        return `${value.toFixed(1)}h`;
      case 'km':
        return `${value.toFixed(0)} km`;
      default:
        return value.toString();
    }
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn(
            "font-mono text-xs font-semibold",
            percentage >= 100 ? "text-emerald-500" : "text-foreground"
          )}>
            {formatValue(current)}
          </span>
          <span className="text-2xs text-muted-foreground">/ {formatValue(goal)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function WeeklyGoalsProgress() {
  const { weeklyProgress, weeklyGoals, isLoading } = useGamification();

  if (isLoading || !weeklyProgress || !weeklyGoals) {
    return null;
  }

  const allGoalsComplete = 
    weeklyProgress.earnings >= weeklyGoals.earnings &&
    weeklyProgress.services >= weeklyGoals.services &&
    weeklyProgress.km >= weeklyGoals.km &&
    weeklyProgress.hours >= weeklyGoals.hours;

  return (
    <div className={cn(
      "rounded-xl p-4 border transition-all",
      allGoalsComplete 
        ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30" 
        : "bg-card border-border/50"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Target className={cn(
          "w-4 h-4",
          allGoalsComplete ? "text-emerald-500" : "text-primary"
        )} />
        <span className="font-medium text-sm text-foreground">Metas da Semana</span>
        {allGoalsComplete && (
          <span className="text-2xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
            Completas! 🎉
          </span>
        )}
      </div>

      <div className="space-y-3">
        <GoalItem
          label="Ganhos"
          current={weeklyProgress.earnings}
          goal={weeklyGoals.earnings}
          format="currency"
          icon={<TrendingUp className="w-3 h-3" />}
        />
        <GoalItem
          label="Serviços"
          current={weeklyProgress.services}
          goal={weeklyGoals.services}
          format="number"
          icon={<Hash className="w-3 h-3" />}
        />
        <GoalItem
          label="Quilômetros"
          current={weeklyProgress.km}
          goal={weeklyGoals.km}
          format="km"
          icon={<Navigation className="w-3 h-3" />}
        />
        <GoalItem
          label="Horas"
          current={weeklyProgress.hours}
          goal={weeklyGoals.hours}
          format="hours"
          icon={<Clock className="w-3 h-3" />}
        />
      </div>
    </div>
  );
}
