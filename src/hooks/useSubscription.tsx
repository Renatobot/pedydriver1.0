import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  Subscription, 
  SubscriptionLimits, 
  FREE_LIMITS, 
  PRO_LIMITS,
  PremiumFeature 
} from '@/types/subscription';
import { startOfMonth, format, subDays } from 'date-fns';

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user
  });

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const limits: SubscriptionLimits = isPro ? PRO_LIMITS : FREE_LIMITS;

  const canAccess = (feature: PremiumFeature): boolean => {
    if (isPro) return true;
    
    switch (feature) {
      case 'weeklyView':
        return limits.canAccessWeeklyView;
      case 'monthlyView':
        return limits.canAccessMonthlyView;
      case 'advancedCharts':
        return limits.canAccessAdvancedCharts;
      case 'bestTimes':
        return limits.canAccessBestTimes;
      case 'platformRanking':
        return limits.canAccessPlatformRanking;
      case 'unlimitedHistory':
      case 'unlimitedPlatforms':
      case 'unlimitedEntries':
        return isPro;
      default:
        return false;
    }
  };

  // Get the date limit for history based on plan
  const getHistoryStartDate = (): string => {
    if (isPro) {
      return '1970-01-01'; // Effectively unlimited
    }
    return format(subDays(new Date(), limits.historyDays), 'yyyy-MM-dd');
  };

  return {
    subscription,
    isLoading,
    error,
    isPro,
    plan: subscription?.plan || 'free',
    limits,
    canAccess,
    getHistoryStartDate,
  };
}

// Hook to check monthly entry count
export function useMonthlyEntryCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthlyEntryCount', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Count earnings
      const { count: earningsCount } = await supabase
        .from('earnings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate);
      
      // Count expenses
      const { count: expensesCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate);
      
      // Count shifts
      const { count: shiftsCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate);
      
      return (earningsCount || 0) + (expensesCount || 0) + (shiftsCount || 0);
    },
    enabled: !!user
  });
}

// Hook to check platform count
export function useUserPlatformCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userPlatformCount', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      
      const { count } = await supabase
        .from('platforms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_default', false);
      
      return count || 0;
    },
    enabled: !!user
  });
}
