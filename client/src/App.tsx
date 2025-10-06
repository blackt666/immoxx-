
import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './lib/queryClient';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeConfigProvider } from './contexts/ThemeConfigContext';

// Eager load critical pages (Landing page for fast initial load)
import Landing from './pages/Landing';

// Lazy load all other pages for code splitting
const AdminLogin = lazy(() => import('./pages/admin-login'));
const AdminDashboard = lazy(() => import('./pages/admin-dashboard'));
const CRMDashboard = lazy(() => import('./pages/crm-dashboard'));
const Properties = lazy(() => import('./pages/properties'));
const PropertyDetails = lazy(() => import('./pages/property-details'));
const AIValuation = lazy(() => import('./pages/ai-valuation'));
const Impressum = lazy(() => import('./pages/impressum'));
const Datenschutz = lazy(() => import('./pages/datenschutz'));
const AGB = lazy(() => import('./pages/agb'));
const Widerrufsrecht = lazy(() => import('./pages/widerrufsrecht'));
const CookieEinstellungen = lazy(() => import('./pages/cookie-einstellungen'));
const NotFound = lazy(() => import('./pages/not-found'));
const AdminUserLogin = lazy(() => import('./pages/adminuser-login'));
const AdminUserDashboard = lazy(() => import('./pages/adminuser-dashboard'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-lg text-muted-foreground">Lädt...</p>
    </div>
  </div>
);

// Ultra-simple query client - no retries, no background fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// Protected Route Component für Admin - Using useAuth hook
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, error } = useAuth();

  console.log('🔍 ProtectedRoute check - User:', user, 'Loading:', isLoading, 'Error:', error);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Lädt...</div>
    </div>;
  }

  // If we get a user (including mock admin when AUTH_ENABLED=false), allow access
  if (user) {
    return <>{children}</>;
  }

  // Only redirect to login if we have an error and no user
  if (error) {
    console.log('🔄 Redirecting to login - User:', user, 'Error:', error);
    window.location.href = '/admin/login';
    return null;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeConfigProvider>
        <LanguageProvider>
          <Router>
            <div className="App">
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  {/* Public Routes */}
                  <Route path="/" component={Landing} />
                  <Route path="/properties" component={Properties} />
                  <Route path="/properties/:id" component={PropertyDetails} />
                  <Route path="/ai-valuation" component={AIValuation} />

                  {/* New Admin User Routes */}
                  <Route path="/adminuser" component={AdminUserLogin} />
                  <Route path="/adminuser/dashboard" component={AdminUserDashboard} />

                  {/* Old Admin Routes (kept for compatibility) */}
                  <Route path="/admin/login" component={AdminLogin} />
                  <Route path="/admin/crm/dashboard" component={CRMDashboard} />
                  <Route path="/admin/crm/customers">
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin/crm/leads">
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin/crm/appointments">
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/admin">
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>

                  {/* Legal Pages */}
                  <Route path="/impressum" component={Impressum} />
                  <Route path="/datenschutz" component={Datenschutz} />
                  <Route path="/agb" component={AGB} />
                  <Route path="/widerrufsrecht" component={Widerrufsrecht} />
                  <Route path="/widerruf" component={Widerrufsrecht} />
                  <Route path="/cookie-einstellungen" component={CookieEinstellungen} />

                  {/* 404 */}
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </div>
          </Router>
          <Toaster />
        </LanguageProvider>
      </ThemeConfigProvider>
    </QueryClientProvider>
  );
}
