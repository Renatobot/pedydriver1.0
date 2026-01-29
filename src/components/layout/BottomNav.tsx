import { Home, Plus, BarChart3, Settings, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Resumo' },
  { to: '/quick', icon: Zap, label: 'Rápido' },
  { to: '/add', icon: Plus, label: 'Lançar' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom safe-left safe-right">
      <div className="flex items-center justify-around h-18 sm:h-20 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-1 sm:px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all touch-feedback',
                'min-w-[56px] sm:min-w-[64px] min-h-[52px] sm:min-h-[56px]',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isActive && 'animate-pulse-glow')} />
              <span className="text-2xs sm:text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
