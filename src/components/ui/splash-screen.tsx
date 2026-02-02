import { useState, useEffect } from 'react';
import logo3d from '@/assets/logo-3d-micro.webp';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-all duration-500",
        isExiting && "opacity-0 scale-110"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      
      {/* Glow effect behind logo */}
      <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Logo container with animations */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Main logo with entrance animation */}
        <div 
          className={cn(
            "relative animate-[splash-logo-enter_0.8s_ease-out_forwards]",
          )}
        >
          {/* Rotating glow ring */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary via-primary/50 to-primary opacity-50 blur-xl animate-[spin_3s_linear_infinite]" />
          
          {/* Logo */}
          <img 
            src={logo3d} 
            alt="PEDY Driver" 
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl shadow-2xl"
          />
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>
        
        {/* Brand name with fade in */}
        <div className="animate-[splash-text-enter_0.6s_ease-out_0.4s_forwards] opacity-0">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            PEDY Driver
          </h1>
        </div>
        
        {/* Loading indicator */}
        <div className="animate-[splash-text-enter_0.6s_ease-out_0.6s_forwards] opacity-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page loading component (lighter version for route transitions)
export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {/* Logo with pulse animation */}
      <div className="relative">
        <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
        <img 
          src={logo3d} 
          alt="PEDY Driver" 
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg animate-[pulse_2s_ease-in-out_infinite]"
        />
      </div>
      
      {/* Loading bar */}
      <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-[loading-bar_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
