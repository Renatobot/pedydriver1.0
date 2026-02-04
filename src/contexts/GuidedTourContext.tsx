import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const TOUR_KEY = 'pedy_guided_tour_completed';

interface GuidedTourContextType {
  showTour: boolean;
  currentStep: number;
  isLoading: boolean;
  completeTour: () => void;
  resetTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  totalSteps: number;
}

const TOTAL_STEPS = 7; // Number of tour steps

const GuidedTourContext = createContext<GuidedTourContextType | null>(null);

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
      setCurrentStep(0);
    }

    setIsLoading(false);
  }, [user]);

  const completeTour = useCallback(() => {
    if (user) {
      localStorage.setItem(`${TOUR_KEY}_${user.id}`, 'true');
    }
    setShowTour(false);
    setCurrentStep(0);
  }, [user]);

  const resetTour = useCallback(() => {
    if (user) {
      localStorage.removeItem(`${TOUR_KEY}_${user.id}`);
    }
    setCurrentStep(0);
    // Navigate to dashboard first, then show tour
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Use setTimeout to ensure navigation completes before showing tour
    setTimeout(() => {
      setShowTour(true);
    }, 150);
  }, [user, navigate, location.pathname]);

  const nextStep = useCallback(() => {
    if (currentStep >= TOTAL_STEPS - 1) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  return (
    <GuidedTourContext.Provider value={{ 
      showTour, 
      currentStep,
      isLoading, 
      completeTour, 
      resetTour,
      nextStep,
      prevStep,
      totalSteps: TOTAL_STEPS,
    }}>
      {children}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTourContext() {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTourContext must be used within a GuidedTourProvider');
  }
  return context;
}
