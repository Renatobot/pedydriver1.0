import { ReactNode } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { PremiumFeature, FEATURE_NAMES } from '@/types/subscription';
import { UpgradeCard } from './UpgradeCard';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  showTeaser?: boolean;
  teaserClassName?: string;
  fallback?: ReactNode;
}

export function FeatureGate({ 
  feature, 
  children, 
  showTeaser = true,
  teaserClassName,
  fallback 
}: FeatureGateProps) {
  const { canAccess } = useSubscriptionContext();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showTeaser) {
    return null;
  }

  return (
    <div className={cn('relative', teaserClassName)}>
      {/* Blurred content preview */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay with upgrade card */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <UpgradeCard 
            feature={feature}
            compact
          />
        </div>
      </div>
    </div>
  );
}

// Simple lock indicator for inline use
interface FeatureLockProps {
  feature: PremiumFeature;
  children: ReactNode;
}

export function FeatureLock({ feature, children }: FeatureLockProps) {
  const { canAccess } = useSubscriptionContext();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return null;
}
