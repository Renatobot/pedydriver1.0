import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline' | 'pill';
}

export function PremiumBadge({ className, size = 'sm', variant = 'default' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-2xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (variant === 'inline') {
    return (
      <span className={cn(
        'inline-flex items-center gap-0.5 text-amber-500',
        sizeClasses[size],
        className
      )}>
        <Crown className={iconSizes[size]} />
        <span className="font-semibold">PRO</span>
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold shadow-sm',
        sizeClasses[size],
        className
      )}>
        <Crown className={iconSizes[size]} />
        PRO
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-medium',
      sizeClasses[size],
      className
    )}>
      <Crown className={iconSizes[size]} />
      PRO
    </span>
  );
}
