import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@/lib/queryClient";
import { LogIn, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import type { AuthResponse } from "@/types/admin";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  // Handle login success with proper query invalidation
  const handleLoginSuccess = async (data: AuthResponse) => {
    console.log('✅ Login successful via useLogin hook:', data);
    toast({
      title: "Erfolgreich angemeldet",
      description: "Willkommen zurück im Admin-Dashboard",
    });
    
    // Force invalidate and refetch auth queries to ensure ProtectedRoute updates
    await queryClient.invalidateQueries({ queryKey: ['user'] });
    await queryClient.refetchQueries({ queryKey: ['user'] });
    
    // Small delay to ensure auth state is fully updated
    setTimeout(() => {
      setLocation("/admin");
    }, 200);
  };

  // Handle login error
  const handleLoginError = (error: Error) => {
    console.error('❌ Login error:', error);
    toast({
      title: "Anmeldung fehlgeschlagen",
      description: error?.message || "Ungültige Anmeldedaten",
      variant: "destructive",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🔐 Attempting login for:', credentials.username);
    loginMutation.mutate(credentials, {
      onSuccess: handleLoginSuccess,
      onError: handleLoginError
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--bodensee-shore)] via-[var(--bodensee-sand)] to-[var(--bodensee-shore)]">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-[#D9CDBF]">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[var(--bodensee-deep)] to-[var(--bodensee-water)]">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#566B73]">Admin Login</h2>
            <p className="mt-2 text-sm text-[#8A8A8A]">
              Bodensee Immobilien Verwaltung
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                Benutzername
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Benutzername eingeben"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="h-12 border-gray-300 focus:border-[var(--arctic-blue)] focus:ring-[var(--arctic-blue)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort eingeben"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="h-12 pr-12 border-gray-300 focus:border-[var(--bodensee-water)] focus:ring-[var(--bodensee-water)]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-br from-[var(--bodensee-deep)] to-[var(--bodensee-water)]"
              style={{
                boxShadow: '0 4px 6px rgba(86, 107, 115, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Anmeldung läuft...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Anmelden
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}