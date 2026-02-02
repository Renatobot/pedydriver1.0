import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ThemeToggle } from './ThemeToggle';
import { EntryLimitIndicator } from '@/components/subscription/EntryLimitBanner';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isPro } = useSubscriptionContext();

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-3 right-3 z-50 safe-top">
        <ThemeToggle />
      </div>

      {/* Global Entry Limit Indicator */}
      {!isPro && (
        <div className="fixed top-0 left-0 right-0 z-40 px-3 py-2 bg-background/80 backdrop-blur-sm border-b border-border/50 safe-top">
          <div className="max-w-lg mx-auto pr-12">
            <EntryLimitIndicator />
          </div>
        </div>
      )}
      
      <main className={`pb-20 ${isPro ? 'safe-top pt-14' : 'pt-14'}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
