import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'pedy_onboarding_completed';

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check if user has completed onboarding
    const completedOnboarding = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`);
    
    // Also check if user is new (created within last 5 minutes)
    const userCreatedAt = user.created_at ? new Date(user.created_at) : null;
    const isNewUser = userCreatedAt 
      ? (Date.now() - userCreatedAt.getTime()) < 5 * 60 * 1000 
      : false;

    // Show onboarding if not completed and user is new
    if (!completedOnboarding && isNewUser) {
      setShowOnboarding(true);
    }

    setIsLoading(false);
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${user.id}`);
    }
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
