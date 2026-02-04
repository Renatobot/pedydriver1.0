import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SyncProvider } from "@/contexts/SyncContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SyncStatusIndicator } from "@/components/layout/SyncStatusIndicator";
import { ThemeProvider } from "@/components/theme-provider";
import { PageLoader } from "@/components/ui/splash-screen";
import { supabase } from "@/integrations/supabase/client";

// Lazy load all pages for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));

// Lazy load non-critical pages
const Add = lazy(() => import("./pages/Add"));
const QuickEntry = lazy(() => import("./pages/QuickEntry"));
const Reports = lazy(() => import("./pages/Reports"));
const History = lazy(() => import("./pages/History"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Settings = lazy(() => import("./pages/Settings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminPendingPayments = lazy(() => import("./pages/admin/AdminPendingPayments"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Smart public route - only redirects if user is already logged in when first loading the page
// Does NOT redirect during the login process (Auth.tsx handles that)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    // Only check on initial mount if user is already logged in
    if (!loading && user && initialCheck) {
      supabase.rpc('is_admin').then(({ data, error }) => {
        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
        setInitialCheck(false);
      });
    } else if (!loading && !user) {
      setInitialCheck(false);
    }
  }, [user, loading, initialCheck]);

  if (loading || (user && initialCheck)) {
    return <PageLoader />;
  }

  // Only redirect if user was ALREADY logged in when component mounted
  if (user && !initialCheck && isAdmin !== null) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quick" element={<ProtectedRoute><QuickEntry /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><Add /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        {/* Admin Routes - protection handled by AdminLayout */}
        <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute><AdminSubscriptions /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><AdminPendingPayments /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><AdminLogs /></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute><AdminSupport /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <SubscriptionProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <SyncStatusIndicator />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </SubscriptionProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
