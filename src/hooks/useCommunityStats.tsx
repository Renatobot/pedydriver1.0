import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { useDashboard } from './useDashboard';
import { format } from 'date-fns';

export interface CommunityMetric {
  metric: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  avg: number;
  count: number;
}

export interface UserRanking {
  metric: string;
  label: string;
  icon: string;
  userValue: number;
  percentile: number;
  description: string;
}

export function useCommunityStats() {
  const { user } = useAuth();
  const { stats } = useGamification();
  const { metrics } = useDashboard('week');

  const currentPeriod = format(new Date(), 'yyyy-MM');

  const { data: communityStats, isLoading } = useQuery({
    queryKey: ['community-stats', currentPeriod],
    staleTime: 30 * 60 * 1000, // 30 minutes - stats don't change often
    queryFn: async (): Promise<CommunityMetric[]> => {
      const { data, error } = await supabase
        .from('community_stats')
        .select('*')
        .eq('period', currentPeriod);

      if (error) throw error;
      return (data || []) as CommunityMetric[];
    },
    enabled: !!user?.id,
  });

  // Calculate user's percentile for each metric
  const getUserPercentile = (value: number, stat: CommunityMetric): number => {
    if (stat.count < 10) return 0; // Not enough users

    if (value <= stat.p10) return 10;
    if (value <= stat.p25) return 25;
    if (value <= stat.p50) return 50;
    if (value <= stat.p75) return 75;
    if (value <= stat.p90) return 90;
    return 95; // Top 5%
  };

  // Build user rankings
  const userRankings: UserRanking[] = [];

  if (communityStats && communityStats.length > 0) {
    // Revenue per hour
    const revenuePerHourStat = communityStats.find(s => s.metric === 'revenue_per_hour');
    if (revenuePerHourStat && metrics.revenuePerHour > 0) {
      const percentile = getUserPercentile(metrics.revenuePerHour, revenuePerHourStat);
      if (percentile > 0) {
        userRankings.push({
          metric: 'revenue_per_hour',
          label: 'R$/hora',
          icon: '⏱️',
          userValue: metrics.revenuePerHour,
          percentile,
          description: percentile >= 75 
            ? `Top ${100 - percentile}% em ganho por hora` 
            : `Acima de ${percentile}% dos motoristas`,
        });
      }
    }

    // Weekly earnings
    const weeklyEarningsStat = communityStats.find(s => s.metric === 'weekly_earnings');
    if (weeklyEarningsStat && stats?.totalEarnings) {
      const percentile = getUserPercentile(metrics.totalRevenue, weeklyEarningsStat);
      if (percentile > 0) {
        userRankings.push({
          metric: 'weekly_earnings',
          label: 'Ganho semanal',
          icon: '💰',
          userValue: metrics.totalRevenue,
          percentile,
          description: percentile >= 75 
            ? `Top ${100 - percentile}% em ganhos semanais` 
            : `Acima de ${percentile}% dos motoristas`,
        });
      }
    }

    // Revenue per km
    const revenuePerKmStat = communityStats.find(s => s.metric === 'revenue_per_km');
    if (revenuePerKmStat && metrics.revenuePerKm > 0) {
      const percentile = getUserPercentile(metrics.revenuePerKm, revenuePerKmStat);
      if (percentile > 0) {
        userRankings.push({
          metric: 'revenue_per_km',
          label: 'R$/km',
          icon: '🛣️',
          userValue: metrics.revenuePerKm,
          percentile,
          description: percentile >= 75 
            ? `Top ${100 - percentile}% em eficiência por km` 
            : `Acima de ${percentile}% dos motoristas`,
        });
      }
    }
  }

  // Sort by percentile (highest first)
  userRankings.sort((a, b) => b.percentile - a.percentile);

  const hasEnoughData = communityStats && communityStats.some(s => s.count >= 10);

  return {
    communityStats: communityStats || [],
    userRankings,
    hasEnoughData,
    isLoading,
  };
}
