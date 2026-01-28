import { Home, Plus, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Resumo' },
  { to: '/add', icon: Plus, label: 'Lançar' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/settings', icon: Settings, label: 'Config' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all touch-target',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'animate-pulse-glow')} />
              <span className="text-2xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
