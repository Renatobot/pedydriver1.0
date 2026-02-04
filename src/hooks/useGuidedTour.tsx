import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const TOUR_KEY = 'pedy_guided_tour_completed';

export function useGuidedTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const completeTour = useCallback(() => {
    if (user) {
      localStorage.setItem(`${TOUR_KEY}_${user.id}`, 'true');
    }
    setShowTour(false);
  }, [user]);

  const resetTour = useCallback(() => {
    if (user) {
      localStorage.removeItem(`${TOUR_KEY}_${user.id}`);
    }
    // Navigate to dashboard first, then show tour
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Use setTimeout to ensure navigation completes before showing tour
    setTimeout(() => {
      setShowTour(true);
    }, 100);
  }, [user, navigate, location.pathname]);

  return {
    showTour,
    isLoading,
    completeTour,
    resetTour,
  };
}
