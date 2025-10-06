import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useLocation } from 'wouter';

interface LoginCredentials {
  username: string;
  password: string;
}

export default function AdminUserLogin() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    // Check credentials
    if (credentials.username !== 'admin' || credentials.password !== 'bodensee2025') {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Ungültige Anmeldedaten",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Make login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);
        
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen im Admin-Dashboard",
        });

        // Store admin session in localStorage for simple session management
        localStorage.setItem('adminuser_session', JSON.stringify({
          user: data,
          timestamp: Date.now()
        }));

        // Redirect to dashboard
        setTimeout(() => {
          setLocation('/adminuser/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: errorData.message || "Ein Fehler ist aufgetreten",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Verbindungsfehler",
        description: "Fehler bei der Verbindung zum Server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[var(--bodensee-deep)] to-[var(--bodensee-water)] rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin-Zugang
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Bodensee Immobilien Verwaltung
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
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
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="bodensee2025"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="h-12 pr-12 border-gray-300 focus:border-[var(--arctic-blue)] focus:ring-[var(--arctic-blue)]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[var(--bodensee-deep)] to-[var(--bodensee-water)] hover:opacity-90 text-white font-medium rounded-lg transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Anmeldung läuft...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Bodensee Immobilien Müller © 2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}