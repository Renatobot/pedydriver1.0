import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const TOUR_KEY = 'pedy_guided_tour_completed';

export function useGuidedTour() {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check if user has completed the guided tour
    const completedTour = localStorage.getItem(`${TOUR_KEY}_${user.id}`);
    
    // Check if user is new (created within last 5 minutes)
    const userCreatedAt = user.created_at ? new Date(user.created_at) : null;
    const isNewUser = userCreatedAt 
      ? (Date.now() - userCreatedAt.getTime()) < 5 * 60 * 1000 
      : false;

    // Show tour if not completed and user is new
    if (!completedTour && isNewUser) {
      setShowTour(true);
    }

    setIsLoading(false);
  }, [user]);

  const completeTour = () => {
    if (user) {
      localStorage.setItem(`${TOUR_KEY}_${user.id}`, 'true');
    }
    setShowTour(false);
  };

  const resetTour = () => {
    if (user) {
      localStorage.removeItem(`${TOUR_KEY}_${user.id}`);
    }
    setShowTour(true);
  };

  return {
    showTour,
    isLoading,
    completeTour,
    resetTour,
  };
}
