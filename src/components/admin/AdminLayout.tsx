import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, FileText, LogOut, Wallet, Menu, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { AdminAlertsBell } from './AdminAlertsBell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import adminLogo from '@/assets/admin-logo-optimized.png';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Assinaturas' },
  { to: '/admin/payments', icon: Wallet, label: 'Pagamentos' },
  { to: '/admin/support', icon: MessageSquare, label: 'Suporte' },
  { to: '/admin/logs', icon: FileText, label: 'Logs' },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <>
      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg transition-colors min-h-[44px]',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-border space-y-2">
        <Link to="/" onClick={onNavigate}>
          <Button variant="outline" className="w-full justify-start gap-2 h-11">
            <LayoutDashboard className="w-4 h-4" />
            Voltar ao App
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-muted-foreground h-11"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set admin-specific favicon and manifest
  useEffect(() => {
    // Store original values
    const originalFavicon = document.querySelector('link[rel="icon"]')?.getAttribute('href');
    const originalManifest = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    const originalTitle = document.title;

    // Update favicon
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = '/icons/admin-icon-512.png';
    }

    // Update manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = '/admin-manifest.json';
    }

    // Update title
    document.title = 'PEDY Admin - Painel Administrativo';

    // Cleanup: restore original values when leaving admin
    return () => {
      if (faviconLink && originalFavicon) {
        faviconLink.href = originalFavicon;
      }
      if (manifestLink && originalManifest) {
        manifestLink.href = originalManifest;
      }
      document.title = originalTitle;
    };
  }, []);

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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 h-14 border-b border-border bg-card flex items-center justify-between px-3 safe-top">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <img src={adminLogo} alt="PEDY Admin" className="w-12 h-12 object-contain" />
                  <span className="font-bold text-lg">Admin</span>
                </div>
              </div>
              <NavContent onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src={adminLogo} alt="PEDY Admin" className="w-10 h-10 object-contain" />
            <span className="font-bold text-base">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminAlertsBell />
        </div>
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 fixed top-0 left-0 h-screen bg-card border-r border-border flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={adminLogo} alt="PEDY Admin" className="w-12 h-12 object-contain" />
              <span className="font-bold text-lg">PEDY Admin</span>
            </div>
          </div>
          <NavContent />
        </aside>

        {/* Main content */}
        <div className="lg:ml-64 flex-1 min-h-screen flex flex-col">
          {/* Desktop Top Header */}
          <header className="hidden lg:flex h-14 border-b border-border bg-card items-center justify-between px-6">
            <div className="text-sm text-muted-foreground truncate">
              {user?.email}
            </div>
            <div className="flex items-center gap-2">
              <AdminAlertsBell />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="p-3 sm:p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
