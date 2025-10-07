
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './lib/queryClient';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeConfigProvider } from './contexts/ThemeConfigContext';

import Landing from './pages/Landing';
import AdminLogin from './pages/admin-login';
import AdminDashboard from './pages/admin-dashboard';
import CRMDashboard from './pages/crm-dashboard';
import { SocialMediaDashboard } from './modules/social-media/components/SocialMediaDashboard';
import Properties from './pages/properties';
import PropertyDetails from './pages/property-details';
import AIValuation from './pages/ai-valuation';
import Impressum from './pages/impressum';
import Datenschutz from './pages/datenschutz';
import AGB from './pages/agb';
import Widerrufsrecht from './pages/widerrufsrecht';
import CookieEinstellungen from './pages/cookie-einstellungen';
import NotFound from './pages/not-found';
import AdminUserLogin from './pages/adminuser-login';
import AdminUserDashboard from './pages/adminuser-dashboard';

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
                <Route path="/admin/social-media">
                  <ProtectedRoute>
                    <SocialMediaDashboard />
                  </ProtectedRoute>
                </Route>
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
            </div>
          </Router>
          <Toaster />
        </LanguageProvider>
      </ThemeConfigProvider>
    </QueryClientProvider>
  );
}
