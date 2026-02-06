import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SyncProvider } from "@/contexts/SyncContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { GuidedTourProvider } from "@/contexts/GuidedTourContext";
import { SyncStatusIndicator } from "@/components/layout/SyncStatusIndicator";
import { ThemeProvider } from "@/components/theme-provider";
import { PageLoader } from "@/components/ui/splash-screen";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";

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
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminPendingPayments = lazy(() => import("./pages/admin/AdminPendingPayments"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

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

// Protected route that also blocks admins from accessing user app
function UserOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admins to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

// Smart public route - redirects logged-in users based on their role
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Only redirect if user is logged in AND we know their role
  if (user && isAdmin !== null) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
        <Route path="/quick" element={<UserOnlyRoute><QuickEntry /></UserOnlyRoute>} />
        <Route path="/add" element={<UserOnlyRoute><Add /></UserOnlyRoute>} />
        <Route path="/reports" element={<UserOnlyRoute><Reports /></UserOnlyRoute>} />
        <Route path="/history" element={<UserOnlyRoute><History /></UserOnlyRoute>} />
        <Route path="/achievements" element={<UserOnlyRoute><Achievements /></UserOnlyRoute>} />
        <Route path="/settings" element={<UserOnlyRoute><Settings /></UserOnlyRoute>} />
        <Route path="/upgrade" element={<UserOnlyRoute><Upgrade /></UserOnlyRoute>} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        {/* Admin Routes - protection handled by AdminLayout */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute><AdminSubscriptions /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><AdminPendingPayments /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
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
        <BrowserRouter>
          <AuthProvider>
            <SyncProvider>
              <SubscriptionProvider>
                <GuidedTourProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <SyncStatusIndicator />
                    <PWAUpdatePrompt />
                    <AppRoutes />
                  </TooltipProvider>
                </GuidedTourProvider>
              </SubscriptionProvider>
            </SyncProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
