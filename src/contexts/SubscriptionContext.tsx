import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription, useMonthlyEntryCount, useUserPlatformCount } from '@/hooks/useSubscription';
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
  canAddEntry: boolean;
  canAddPlatform: boolean;
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

  const canAddEntry = isPro || monthlyEntryCount < limits.maxEntriesPerMonth;
  const canAddPlatform = isPro || userPlatformCount < limits.maxPlatforms;
  
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
        canAddEntry,
        canAddPlatform,
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
