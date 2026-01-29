export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionLimits {
  maxEntriesPerMonth: number;
  maxPlatforms: number;
  historyDays: number;
  canAccessWeeklyView: boolean;
  canAccessMonthlyView: boolean;
  canAccessAdvancedCharts: boolean;
  canAccessBestTimes: boolean;
  canAccessPlatformRanking: boolean;
}

export const FREE_LIMITS: SubscriptionLimits = {
  maxEntriesPerMonth: 30,
  maxPlatforms: 1,
  historyDays: 7,
  canAccessWeeklyView: false,
  canAccessMonthlyView: false,
  canAccessAdvancedCharts: false,
  canAccessBestTimes: false,
  canAccessPlatformRanking: false,
};

export const PRO_LIMITS: SubscriptionLimits = {
  maxEntriesPerMonth: Infinity,
  maxPlatforms: Infinity,
  historyDays: Infinity,
  canAccessWeeklyView: true,
  canAccessMonthlyView: true,
  canAccessAdvancedCharts: true,
  canAccessBestTimes: true,
  canAccessPlatformRanking: true,
};

export type PremiumFeature = 
  | 'weeklyView' 
  | 'monthlyView' 
  | 'advancedCharts' 
  | 'bestTimes' 
  | 'platformRanking'
  | 'unlimitedHistory'
  | 'unlimitedPlatforms'
  | 'unlimitedEntries';

export const FEATURE_NAMES: Record<PremiumFeature, string> = {
  weeklyView: 'Visualização Semanal',
  monthlyView: 'Visualização Mensal',
  advancedCharts: 'Gráficos Avançados',
  bestTimes: 'Melhores Horários',
  platformRanking: 'Ranking de Plataformas',
  unlimitedHistory: 'Histórico Ilimitado',
  unlimitedPlatforms: 'Plataformas Ilimitadas',
  unlimitedEntries: 'Registros Ilimitados',
};
