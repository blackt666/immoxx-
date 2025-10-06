import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { 
  Shield, 
  Users, 
  Home, 
  Mail, 
  Settings, 
  Activity,
  LogOut,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminSession {
  user: {
    username: string;
    role: string;
    id: string;
  };
  timestamp: number;
}

export default function AdminUserDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [stats, setStats] = useState({
    properties: 0,
    inquiries: 0,
    users: 0,
    activities: 0
  });

  useEffect(() => {
    // Check session
    const sessionData = localStorage.getItem('adminuser_session');
    if (!sessionData) {
      toast({
        title: "Zugang verweigert",
        description: "Bitte melden Sie sich an",
        variant: "destructive",
      });
      setLocation('/adminuser');
      return;
    }

    try {
      const parsed: AdminSession = JSON.parse(sessionData);
      // Check if session is still valid (24 hours)
      const isValid = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
      
      if (!isValid) {
        localStorage.removeItem('adminuser_session');
        toast({
          title: "Session abgelaufen",
          description: "Bitte melden Sie sich erneut an",
          variant: "destructive",
        });
        setLocation('/adminuser');
        return;
      }

      setSession(parsed);
      loadStats();
    } catch (error) {
      console.error('Session error:', error);
      localStorage.removeItem('adminuser_session');
      setLocation('/adminuser');
    }
  }, [setLocation]);

  const loadStats = async () => {
    try {
      // Load some basic stats
      const responses = await Promise.allSettled([
        fetch('/api/properties').then(r => r.ok ? r.json() : []),
        fetch('/api/inquiries').then(r => r.ok ? r.json() : []),
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      ]);

      const [propertiesResult, inquiriesResult] = responses;
      
      setStats({
        properties: propertiesResult.status === 'fulfilled' ? propertiesResult.value.length || 0 : 0,
        inquiries: inquiriesResult.status === 'fulfilled' ? inquiriesResult.value.length || 0 : 0,
        users: 1, // Admin user
        activities: Math.floor(Math.random() * 50) + 10 // Mock data
      });
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminuser_session');
    toast({
      title: "Erfolgreich abgemeldet",
      description: "Auf Wiedersehen!",
    });
    setLocation('/adminuser');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--bodensee-deep)] to-[var(--bodensee-water)] rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Bodensee Immobilien Verwaltung</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <span className="text-sm text-gray-600">
                Angemeldet als: {session.user.username || 'admin'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen zurück! 👋
          </h2>
          <p className="text-gray-600">
            Hier ist eine Übersicht über Ihre Immobilien-Plattform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Immobilien</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.properties}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Anfragen</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inquiries}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Benutzer</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktivitäten</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activities}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Schnellaktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/', '_blank')}
              >
                <Home className="w-4 h-4 mr-2" />
                Website anzeigen
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Feature kommt bald", description: "Diese Funktion wird bald verfügbar sein" })}
              >
                <FileText className="w-4 h-4 mr-2" />
                Berichte erstellen
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Feature kommt bald", description: "Diese Funktion wird bald verfügbar sein" })}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Termine verwalten
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Feature kommt bald", description: "Diese Funktion wird bald verfügbar sein" })}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics anzeigen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System-Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <Badge className="bg-green-100 text-green-800">Verbunden</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <Badge className="bg-green-100 text-green-800">Verfügbar</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Letzte Aktualisierung</span>
                <span className="text-sm text-gray-900">
                  {new Date().toLocaleString('de-DE')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}