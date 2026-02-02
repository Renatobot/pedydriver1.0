import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification, ACHIEVEMENTS, Achievement } from '@/hooks/useGamification';
import { 
  Trophy, Flame, Target, Zap, Star, 
  Car, DollarSign, Navigation, Calendar,
  Lock, CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

const CATEGORY_ICONS = {
  services: Car,
  earnings: DollarSign,
  km: Navigation,
  streak: Flame,
  level: Star,
};

const CATEGORY_LABELS = {
  services: 'Serviços',
  earnings: 'Ganhos',
  km: 'Quilômetros',
  streak: 'Sequência',
  level: 'Nível',
};

function AchievementCard({ 
  achievement, 
  isUnlocked, 
  progress 
}: { 
  achievement: Achievement; 
  isUnlocked: boolean; 
  progress: number;
}) {
  const CategoryIcon = CATEGORY_ICONS[achievement.category];

  return (
    <Card className={cn(
      "transition-all",
      isUnlocked 
        ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30" 
        : "bg-card/50 border-border"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
            isUnlocked 
              ? "bg-gradient-to-br from-primary to-accent shadow-lg" 
              : "bg-muted"
          )}>
            {isUnlocked ? (
              achievement.icon
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-sm truncate",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {achievement.name}
              </h3>
              {isUnlocked && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {achievement.description}
            </p>

            {/* Progress */}
            {!isUnlocked && (
              <div className="space-y-1">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% completo
                </p>
              </div>
            )}

            {/* XP Reward */}
            <div className="flex items-center gap-1 mt-2">
              <Zap className={cn(
                "w-3 h-3",
                isUnlocked ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isUnlocked ? "text-primary" : "text-muted-foreground"
              )}>
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { 
    stats, 
    weeklyProgress, 
    weeklyGoals,
    isLoading, 
    xpProgress,
    unlockedAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
  } = useGamification();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) {
    return (
      <AppLayout>
        <div className="p-4 text-center text-muted-foreground">
          Erro ao carregar dados de gamificação
        </div>
      </AppLayout>
    );
  }

  const filteredAchievements = activeTab === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === activeTab);

  const weeklyEarningsProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.earnings / weeklyGoals.earnings) * 100) 
    : 0;
  const weeklyServicesProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.services / weeklyGoals.services) * 100) 
    : 0;
  const weeklyKmProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.km / weeklyGoals.km) * 100) 
    : 0;
  const weeklyHoursProgress = weeklyProgress 
    ? Math.min(100, (weeklyProgress.hours / weeklyGoals.hours) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* Header Stats */}
        <Card className="bg-gradient-to-br from-primary/20 via-card to-accent/20 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              {/* Level Circle */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-primary-foreground">{stats.level}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow">
                  <Zap className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-1">Nível {stats.level}</h2>
                <p className="text-sm text-muted-foreground mb-2">{stats.xp} XP total</p>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Próximo nível</span>
                    <span className="text-primary">{Math.round(xpProgress)}%</span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Dias seguidos</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{unlockedAchievements.length}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <Star className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Maior streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Metas Semanais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Earnings Goal */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Ganhos</span>
                <span className="font-medium">
                  {formatCurrency(weeklyProgress?.earnings || 0)} / {formatCurrency(weeklyGoals.earnings)}
                </span>
              </div>
              <Progress value={weeklyEarningsProgress} className="h-2" />
            </div>

            {/* Services Goal */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Serviços</span>
                <span className="font-medium">
                  {weeklyProgress?.services || 0} / {weeklyGoals.services}
                </span>
              </div>
              <Progress value={weeklyServicesProgress} className="h-2" />
            </div>

            {/* KM Goal */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Quilômetros</span>
                <span className="font-medium">
                  {weeklyProgress?.km.toFixed(0) || 0} / {weeklyGoals.km} km
                </span>
              </div>
              <Progress value={weeklyKmProgress} className="h-2" />
            </div>

            {/* Hours Goal */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Horas trabalhadas</span>
                <span className="font-medium">
                  {weeklyProgress?.hours.toFixed(1) || 0} / {weeklyGoals.hours}h
                </span>
              </div>
              <Progress value={weeklyHoursProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Conquistas
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-6 h-auto p-1">
              <TabsTrigger value="all" className="text-xs py-2">
                Todas
              </TabsTrigger>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                return (
                  <TabsTrigger key={key} value={key} className="text-xs py-2">
                    <Icon className="w-4 h-4" />
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeTab} className="mt-3 space-y-3">
              {filteredAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isAchievementUnlocked(achievement.id)}
                  progress={getAchievementProgress(achievement)}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
