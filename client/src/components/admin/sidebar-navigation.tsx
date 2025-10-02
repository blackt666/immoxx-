import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  Building2,
  MessageSquare,
  Mail,
  Images,
  Settings,
  BarChart3,
  LogOut,
  FileText,
  Camera,
  PlusCircle,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  Bell,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data for notifications - replace with actual API call
const notifications = [
  { id: 1, title: "Neue Anfrage erhalten", message: "Ein Kunde hat über das Kontaktformular angefragt.", type: "info", createdAt: new Date().toISOString() },
  { id: 2, title: "Immobilie stark nachgefragt", message: "Die Immobilie in Musterstraße 123 hat mehrere Anfragen.", type: "warning", createdAt: new Date().toISOString() },
];

interface SidebarNavigationProps {
  onLogout?: () => void;
}

export default function SidebarNavigation({ onLogout }: SidebarNavigationProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(['Übersicht', 'CRM & Kunden']);

  const handleLogout = async () => {
    try {
      console.log("🚪 Admin logout initiated");
      await apiRequest("/api/auth/logout", { method: "POST" });

      // Clear any stored auth data
      sessionStorage.clear();
      localStorage.removeItem("auth-token");

      if (onLogout) {
        onLogout();
      }

      toast({
        title: "Erfolgreich abgemeldet",
        description: "Sie wurden sicher abgemeldet.",
      });

      setLocation("/admin/login");
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: "Es gab ein Problem beim Abmelden.",
        variant: "destructive",
      });

      // Force navigation even on error
      setLocation("/admin/login");
    }
  };

  const navigationCategories = [
    {
      title: "Übersicht",
      items: [
        {
          icon: Home,
          label: "Dashboard",
          path: "/admin/dashboard",
          description: "Übersicht und Statistiken",
        },
      ]
    },
    {
      title: "CRM & Kunden",
      items: [
        {
          icon: Users,
          label: "Kunden",
          path: "/admin/customers",
          description: "Kundenverwaltung & Segmentierung",
        },
        {
          icon: MessageSquare,
          label: "Anfragen",
          path: "/admin/inquiries",
          description: "Kundenanfragen bearbeiten",
        },
        {
          icon: Calendar,
          label: "Termine",
          path: "/admin/appointments",
          description: "Besichtigungen & Tasks",
        },
      ]
    },
    {
      title: "Immobilien",
      items: [
        {
          icon: Building2,
          label: "Immobilien",
          path: "/admin/properties",
          description: "Immobilien verwalten",
        },
        {
          icon: BarChart3,
          label: "Verkaufspipeline",
          path: "/admin/pipeline",
          description: "Sales Funnel & ROI-Tracking",
        },
        {
          icon: Images,
          label: "Galerie",
          path: "/admin/gallery",
          description: "Bilder und 360° Touren",
        },
      ]
    },
    {
      title: "Marketing",
      items: [
        {
          icon: Mail,
          label: "E-Mail Marketing",
          path: "/admin/email-automation",
          description: "Automatisierung & Follow-ups",
        },
        {
          icon: FileText,
          label: "Inhalte",
          path: "/admin/content",
          description: "Website-Inhalte bearbeiten",
        },
      ]
    },
    {
      title: "Dokumente",
      items: [
        {
          icon: FileText,
          label: "Verträge",
          path: "/admin/contracts",
          description: "Vorlagen & E-Signaturen",
        },
        {
          icon: FileText,
          label: "Rechtsdokumente",
          path: "/admin/legal-docs",
          description: "Exposés & Rechtliches",
        },
      ]
    },
    {
      title: "System",
      items: [
        {
          icon: Settings,
          label: "Einstellungen",
          path: "/admin/settings",
          description: "System-Einstellungen",
        },
        {
          icon: Users,
          label: "Integrationen",
          path: "/admin/integrations",
          description: "Notion & API-Verbindungen",
        },
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location === "/admin" || location === "/admin/dashboard";
    }
    return location.startsWith(path);
  };

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryTitle) 
        ? prev.filter(c => c !== categoryTitle)
        : [...prev, categoryTitle]
    );
  };

  const markNotificationAsRead = (id: number) => {
    console.log(`Marking notification ${id} as read`);
    // In a real app, you would call an API here to mark as read
  };

  const markAllAsRead = () => {
    console.log("Marking all notifications as read");
    // In a real app, you would call an API here to mark all as read
  };

  return (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="bg-[var(--bodensee-sand)] text-[var(--bodensee-deep)] p-2 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Admin Panel</h2>
            <p className="text-sm text-white/70 mt-1">Bodensee Immobilien</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-2 px-3">
          {navigationCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.title);

            return (
              <div key={category.title} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between px-2 py-2 text-white/70 hover:text-white/90 transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {category.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="space-y-1 ml-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <Link key={item.path} to={item.path}>
                          <Button
                            variant={active ? "default" : "ghost"}
                            className={`w-full justify-start h-auto p-3 ${
                              active
                                ? "bg-[var(--bodensee-sand)] text-[var(--bodensee-deep)] shadow-sm"
                                : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="font-medium truncate text-sm">{item.label}</div>
                              <div className={`text-xs truncate ${
                                active ? "text-[var(--bodensee-stone)]" : "text-white/60"
                              }`}>
                                {item.description}
                              </div>
                            </div>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 px-3">
          <div className="border-t pt-4 border-white/20">
            <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-2">
              Schnellaktionen
            </p>
            <div className="space-y-1">
              <Link to="/admin/properties/new">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white/70 hover:text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Neue Immobilie
                </Button>
              </Link>
              <Link to="/admin/gallery/upload">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white/70 hover:text-white"
                >
                  <Images className="w-4 h-4 mr-2" />
                  Bilder hochladen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Logout & Notification Bell */}
      <div className="border-t p-4 border-white/20 flex items-center justify-between">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="flex-grow justify-start text-red-400 hover:text-red-500 hover:bg-red-900/50 mr-3"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">Abmelden</div>
            <div className="text-xs text-red-400">Admin Session beenden</div>
          </div>
        </Button>
        {/* Notification Bell */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-gray-100"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Benachrichtigungen ({notifications.length})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Keine neuen Benachrichtigungen</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${notification.type === 'info' ? 'bg-blue-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString('de-DE')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  Alle als gelesen markieren
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}