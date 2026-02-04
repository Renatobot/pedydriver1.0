import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription, useMonthlyEntryCount, useUserPlatformCount, useUsedPlatformIds } from '@/hooks/useSubscription';
import { Subscription, SubscriptionLimits, PremiumFeature } from '@/types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null | undefined;
  isLoading: boolean;
  isPro: boolean;
  plan: 'free' | 'pro';
  limits: SubscriptionLimits;
  canAccess: (feature: PremiumFeature) => boolean;
  getHistoryStartDate: () => string;
  monthlyEntryCount: number;
  userPlatformCount: number;
  usedPlatformIds: string[];
  canAddEntry: boolean;
  canAddPlatform: boolean;
  canUsePlatform: (platformId: string) => boolean;
  remainingEntries: number;
  remainingPlatforms: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { 
    subscription, 
    isLoading, 
    isPro, 
    plan, 
    limits, 
    canAccess, 
    getHistoryStartDate 
  } = useSubscription();
  
  const { data: monthlyEntryCount = 0 } = useMonthlyEntryCount();
  const { data: userPlatformCount = 0 } = useUserPlatformCount();
  const { data: usedPlatformIds = [] } = useUsedPlatformIds();

  const canAddEntry = isPro || monthlyEntryCount < limits.maxEntriesPerMonth;
  const canAddPlatform = isPro || userPlatformCount < limits.maxPlatforms;
  
  // Check if a specific platform can be used based on subscription limits
  const canUsePlatform = (platformId: string): boolean => {
    if (isPro) return true;
    // Allow if already using this platform OR if still has room for new platforms
    return usedPlatformIds.includes(platformId) || userPlatformCount < limits.maxPlatforms;
  };
  
  const remainingEntries = isPro 
    ? Infinity 
    : Math.max(0, limits.maxEntriesPerMonth - monthlyEntryCount);
  
  const remainingPlatforms = isPro 
    ? Infinity 
    : Math.max(0, limits.maxPlatforms - userPlatformCount);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isPro,
        plan,
        limits,
        canAccess,
        getHistoryStartDate,
        monthlyEntryCount,
        userPlatformCount,
        usedPlatformIds,
        canAddEntry,
        canAddPlatform,
        canUsePlatform,
        remainingEntries,
        remainingPlatforms,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
