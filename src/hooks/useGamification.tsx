import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserSettings } from './useUserSettings';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'services' | 'earnings' | 'km' | 'streak' | 'level';
  requirement: number;
  xpReward: number;
}

export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalServices: number;
  totalEarnings: number;
  totalKm: number;
  totalHours: number;
}

export interface WeeklyGoals {
  earnings: number;
  services: number;
  km: number;
  hours: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Services achievements
  { id: 'first_service', name: 'Primeira Corrida', description: 'Complete sua primeira corrida/entrega', icon: '🚗', category: 'services', requirement: 1, xpReward: 50 },
  { id: 'services_10', name: 'Motorista Iniciante', description: 'Complete 10 serviços', icon: '🎯', category: 'services', requirement: 10, xpReward: 100 },
  { id: 'services_50', name: 'Motorista Experiente', description: 'Complete 50 serviços', icon: '⭐', category: 'services', requirement: 50, xpReward: 250 },
  { id: 'services_100', name: 'Motorista Veterano', description: 'Complete 100 serviços', icon: '🏆', category: 'services', requirement: 100, xpReward: 500 },
  { id: 'services_500', name: 'Lenda das Ruas', description: 'Complete 500 serviços', icon: '👑', category: 'services', requirement: 500, xpReward: 1000 },
  
  // Earnings achievements
  { id: 'earnings_100', name: 'Primeira Centena', description: 'Ganhe R$ 100', icon: '💵', category: 'earnings', requirement: 100, xpReward: 50 },
  { id: 'earnings_1000', name: 'Primeiro Milhar', description: 'Ganhe R$ 1.000', icon: '💰', category: 'earnings', requirement: 1000, xpReward: 200 },
  { id: 'earnings_5000', name: 'Acumulador', description: 'Ganhe R$ 5.000', icon: '🤑', category: 'earnings', requirement: 5000, xpReward: 500 },
  { id: 'earnings_10000', name: 'Mestre do Lucro', description: 'Ganhe R$ 10.000', icon: '💎', category: 'earnings', requirement: 10000, xpReward: 1000 },
  
  // KM achievements
  { id: 'km_100', name: 'Explorador Local', description: 'Rode 100 km', icon: '🛣️', category: 'km', requirement: 100, xpReward: 100 },
  { id: 'km_500', name: 'Viajante', description: 'Rode 500 km', icon: '🗺️', category: 'km', requirement: 500, xpReward: 250 },
  { id: 'km_1000', name: 'Maratonista', description: 'Rode 1.000 km', icon: '🏎️', category: 'km', requirement: 1000, xpReward: 500 },
  { id: 'km_5000', name: 'Globetrotter', description: 'Rode 5.000 km', icon: '🌍', category: 'km', requirement: 5000, xpReward: 1000 },
  
  // Streak achievements
  { id: 'streak_3', name: 'Consistente', description: 'Mantenha uma sequência de 3 dias', icon: '🔥', category: 'streak', requirement: 3, xpReward: 75 },
  { id: 'streak_7', name: 'Semana Perfeita', description: 'Mantenha uma sequência de 7 dias', icon: '🔥🔥', category: 'streak', requirement: 7, xpReward: 200 },
  { id: 'streak_14', name: 'Duas Semanas Fortes', description: 'Mantenha uma sequência de 14 dias', icon: '💪', category: 'streak', requirement: 14, xpReward: 400 },
  { id: 'streak_30', name: 'Mês de Ferro', description: 'Mantenha uma sequência de 30 dias', icon: '🏅', category: 'streak', requirement: 30, xpReward: 1000 },
  
  // Level achievements
  { id: 'level_5', name: 'Nível 5', description: 'Alcance o nível 5', icon: '📈', category: 'level', requirement: 5, xpReward: 100 },
  { id: 'level_10', name: 'Nível 10', description: 'Alcance o nível 10', icon: '🚀', category: 'level', requirement: 10, xpReward: 250 },
  { id: 'level_25', name: 'Nível 25', description: 'Alcance o nível 25', icon: '⚡', category: 'level', requirement: 25, xpReward: 500 },
  { id: 'level_50', name: 'Nível 50', description: 'Alcance o nível 50', icon: '🌟', category: 'level', requirement: 50, xpReward: 1000 },
];

// Default weekly goals (used when no user settings are available)
export const DEFAULT_WEEKLY_GOALS = {
  earnings: 1500,
  services: 50,
  km: 300,
  hours: 40,
};

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: userSettings } = useUserSettings();

  // Get user's custom weekly goals or use defaults
  const weeklyGoals: WeeklyGoals = {
    earnings: userSettings?.weekly_goal_earnings ?? DEFAULT_WEEKLY_GOALS.earnings,
    services: userSettings?.weekly_goal_services ?? DEFAULT_WEEKLY_GOALS.services,
    km: userSettings?.weekly_goal_km ?? DEFAULT_WEEKLY_GOALS.km,
    hours: userSettings?.weekly_goal_hours ?? DEFAULT_WEEKLY_GOALS.hours,
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gamification-stats', user?.id],
    staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
    queryFn: async (): Promise<GamificationStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial record
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          xp: newData.xp,
          level: newData.level,
          currentStreak: newData.current_streak,
          longestStreak: newData.longest_streak,
          totalServices: newData.total_services,
          totalEarnings: Number(newData.total_earnings),
          totalKm: Number(newData.total_km),
          totalHours: Number(newData.total_hours),
        };
      }

      return {
        xp: data.xp,
        level: data.level,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        totalServices: data.total_services,
        totalEarnings: Number(data.total_earnings),
        totalKm: Number(data.total_km),
        totalHours: Number(data.total_hours),
      };
    },
    enabled: !!user?.id,
  });

  const { data: unlockedAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: weeklyProgress, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-goals', user?.id],
    staleTime: 2 * 60 * 1000, // 2 minutes - weekly goals can change more often
    queryFn: async (): Promise<WeeklyGoals> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_weekly_goals', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as { earnings: number; services: number; km: number; hours: number };
      return {
        earnings: Number(result.earnings),
        services: result.services,
        km: Number(result.km),
        hours: Number(result.hours),
      };
    },
    enabled: !!user?.id,
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  // Check and unlock achievements based on current stats
  const checkAchievements = () => {
    if (!stats || !unlockedAchievements) return;

    const unlockedIds = new Set(unlockedAchievements.map(a => a.achievement_id));

    ACHIEVEMENTS.forEach(achievement => {
      if (unlockedIds.has(achievement.id)) return;

      let isUnlocked = false;

      switch (achievement.category) {
        case 'services':
          isUnlocked = stats.totalServices >= achievement.requirement;
          break;
        case 'earnings':
          isUnlocked = stats.totalEarnings >= achievement.requirement;
          break;
        case 'km':
          isUnlocked = stats.totalKm >= achievement.requirement;
          break;
        case 'streak':
          isUnlocked = stats.longestStreak >= achievement.requirement;
          break;
        case 'level':
          isUnlocked = stats.level >= achievement.requirement;
          break;
      }

      if (isUnlocked) {
        unlockAchievementMutation.mutate(achievement.id);
      }
    });
  };

  // Calculate XP to next level
  const xpToNextLevel = stats ? ((stats.level) * 500) - stats.xp : 500;
  const xpProgress = stats ? (stats.xp % 500) / 500 * 100 : 0;

  // Get achievement progress
  const getAchievementProgress = (achievement: Achievement): number => {
    if (!stats) return 0;

    let current = 0;
    switch (achievement.category) {
      case 'services':
        current = stats.totalServices;
        break;
      case 'earnings':
        current = stats.totalEarnings;
        break;
      case 'km':
        current = stats.totalKm;
        break;
      case 'streak':
        current = stats.longestStreak;
        break;
      case 'level':
        current = stats.level;
        break;
    }

    return Math.min(100, (current / achievement.requirement) * 100);
  };

  // Check if achievement is unlocked
  const isAchievementUnlocked = (achievementId: string): boolean => {
    return unlockedAchievements?.some(a => a.achievement_id === achievementId) || false;
  };

  return {
    stats,
    weeklyProgress,
    weeklyGoals,
    unlockedAchievements: unlockedAchievements || [],
    achievements: ACHIEVEMENTS,
    isLoading: statsLoading || achievementsLoading || weeklyLoading,
    xpToNextLevel,
    xpProgress,
    checkAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
  };
}
