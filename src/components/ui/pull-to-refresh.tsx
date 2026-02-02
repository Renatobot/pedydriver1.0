import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

const THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children, className, disabled }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = Math.min(diff * 0.4, THRESHOLD + 20);
      setPullDistance(resistance);
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD / 2);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, disabled]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 180;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-200 z-10",
          pullDistance > 10 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: Math.max(pullDistance - 40, 8),
          transition: isPulling.current ? 'none' : 'top 0.3s ease-out, opacity 0.2s ease-out'
        }}
      >
        <div 
          className={cn(
            "w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw 
            className={cn(
              "w-4 h-4 text-primary transition-transform",
              pullDistance >= THRESHOLD && !isRefreshing && "text-primary"
            )}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>
      
      {/* Content wrapper */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
