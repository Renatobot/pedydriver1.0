import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { AdminAlertsBell } from './AdminAlertsBell';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Assinaturas' },
  { to: '/admin/logs', icon: FileText, label: 'Logs' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">PEDY Driver Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Voltar ao App
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="text-sm text-muted-foreground">
            Olá, {user?.email}
          </div>
          <div className="flex items-center gap-2">
            <AdminAlertsBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
