import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import DashboardOverview from "@/components/admin/dashboard-overview";
import PropertiesManagement from "@/components/admin/properties-management";
import GalleryManagement from "@/components/admin/gallery-management";
import InquiriesManagement from "@/components/admin/inquiries-management";
import NewsletterManagement from "@/components/admin/newsletter-management";
import ContentEditor from "@/components/admin/content-editor";
import SettingsPanel from "@/components/admin/settings-panel";
import NotionIntegration from "@/components/admin/notion-integration";
import SystemDiagnostic from "@/components/admin/system-diagnostic";
import SEOStrategyEditor from "@/components/admin/seo-strategy-editor";
import PropertyAutoGenerator from "@/components/admin/property-auto-generator";
import PerformanceDashboard from "../components/admin/performance-dashboard";
import CRMCustomers from "../pages/admin/crm-customers";
import CRMAppointments from "../pages/admin/crm-appointments";
import CRMLeads from "../pages/admin/crm-leads";
import CalendarIntegration from "../components/CalendarIntegration";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Building, Image, MessageSquare, Send, Edit, Link, Settings, Activity, LogOut, FileText, Target, Search, HelpCircle, Users, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import DashboardSearch from "@/components/admin/dashboard-search";
import DashboardHelp from "@/components/admin/dashboard-help";
import NotificationBell from "@/components/admin/notification-bell";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, isActive, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'text-[var(--bodensee-deep)] font-medium'
        : 'text-[var(--bodensee-sand)] hover:text-white hover:bg-white/10'
    }`}
    style={isActive ? {backgroundColor: 'var(--bodensee-sand)'} : {}}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </button>
);

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Check authentication
  const { user } = useAuth();
  const isLoading = false; // Auth context doesn't have loading state

  // Set activeTab based on current URL path
  useEffect(() => {
    if (location.includes('/admin/crm/customers')) {
      setActiveTab('crm-customers');
    } else if (location.includes('/admin/crm/leads')) {
      setActiveTab('crm-leads');
    } else if (location.includes('/admin/crm/appointments')) {
      setActiveTab('crm-appointments');
    } else if (location === '/admin') {
      setActiveTab('dashboard');
    }
  }, [location]);

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🔐 No authenticated user found, redirecting to login');
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-[var(--bodensee-water)]">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Lade Dashboard...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (useEffect will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-[var(--bodensee-water)]">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Weiterleitung zum Login...</span>
        </div>
      </div>
    );
  }

  console.log('✅ User authenticated:', user);

  const tabTitles = {
    dashboard: { title: "Dashboard", subtitle: `Willkommen zurück, ${user?.name || user?.username || 'Admin'}` },
    properties: { title: "Immobilien", subtitle: "Verwalten Sie Ihre Immobilien" },
    gallery: { title: "Galerie", subtitle: "Bilder verwalten und organisieren" },
    inquiries: { title: "Anfragen", subtitle: "Kundenanfragen bearbeiten" },
    newsletter: { title: "Newsletter", subtitle: "Newsletter erstellen und versenden" },
    content: { title: "Content Editor", subtitle: "Website-Inhalte bearbeiten" },
    settings: { title: "Einstellungen", subtitle: "System-Konfiguration" },
    notion: { title: "Notion Integration", subtitle: "Synchronisieren Sie Daten mit Notion" },
    diagnostic: { title: "System-Diagnose", subtitle: "Vollständige Funktionsprüfung" },
    seo: { title: "SEO Strategien", subtitle: "Verwalten Sie Ihre SEO-Strategien" },
    "auto-generator": { title: "Auto-Generator", subtitle: "Erstellen Sie Immobilienanzeigen automatisch" },
    performance: { title: "Performance Monitoring", subtitle: "Überwachen Sie die Systemleistung" },
    "crm-customers": { title: "CRM - Kunden", subtitle: "Verwalten Sie Ihre Kundenbeziehungen" },
    "crm-appointments": { title: "CRM - Termine", subtitle: "Verwalten Sie Ihre Termine und Besichtigungen" },
    "crm-leads": { title: "CRM - Leads", subtitle: "Verwalten Sie Ihre Sales Pipeline" },
    "calendar-integration": { title: "Kalender-Integration", subtitle: "Verwalten Sie Ihre Kalender-Verbindungen" }
  };

  const currentTab = tabTitles[activeTab as keyof typeof tabTitles] || tabTitles.dashboard;

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview onTabChange={setActiveTab} />;
      case "properties":
        return <PropertiesManagement />;
      case "gallery":
        return <GalleryManagement />;
      case "inquiries":
        return <InquiriesManagement />;
      case "newsletter":
        return <NewsletterManagement />;
      case "content":
        return <ContentEditor />;
      case "settings":
        return <SettingsPanel />;
      case "notion":
        return <NotionIntegration />;
      case "diagnostic":
        return <SystemDiagnostic />;
      case "performance":
          return <PerformanceDashboard />;
      case "seo":
        return <SEOStrategyEditor />;
      case "auto-generator":
        return <PropertyAutoGenerator />;
      case "crm-customers":
        return <CRMCustomers />;
      case "crm-appointments":
        return <CRMAppointments />;
      case "crm-leads":
        return <CRMLeads />;
      case "calendar-integration":
        return <CalendarIntegration />;
      default:
        return <DashboardOverview onTabChange={setActiveTab} />;
    }
  };

  // Dummy handleLogout function for demonstration
  const handleLogout = () => {
    console.log("Logging out...");
    // In a real app, you would clear tokens, redirect to login, etc.
    setLocation("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F5F5F5] to-[#E8F4F8]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, overlay when open */}
      <div className={`
        fixed lg:relative lg:translate-x-0 z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:block
      `}>
        <div className="w-64 text-white p-6 min-h-screen sidebar-gradient">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-lg bg-bodensee-bermuda-sand text-bodensee-ruskin-blue flex items-center justify-center mr-3">
                  <span className="font-bold">AM</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">MÜLLER</h2>
                  <p className="text-bodensee-bermuda-sand text-sm opacity-90">Admin Dashboard</p>
                </div>
              </div>
          <nav className="space-y-2">
                <NavItem icon={LayoutDashboard} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavItem icon={Building} label="Immobilien" isActive={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
                <NavItem icon={Image} label="Galerie" isActive={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
                <NavItem icon={MessageSquare} label="Anfragen" isActive={activeTab === 'inquiries'} onClick={() => setActiveTab('inquiries')} />
                
                {/* CRM Section */}
                <div className="pt-2 mt-2 border-t border-white/20">
                  <p className="text-xs text-[#D9CDBF] uppercase tracking-wider mb-2 px-4">CRM System</p>
                  <a
                    href="/admin/crm/dashboard"
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-[var(--bodensee-sand)] hover:text-white hover:bg-white/10 mb-1"
                  >
                    <span className="mr-3">📊</span>
                    CRM Dashboard
                  </a>
                  <NavItem icon={Users} label="Kunden" isActive={activeTab === 'crm-customers'} onClick={() => setActiveTab('crm-customers')} />
                  <NavItem icon={Calendar} label="Termine" isActive={activeTab === 'crm-appointments'} onClick={() => setActiveTab('crm-appointments')} />
                  <NavItem icon={TrendingUp} label="Leads" isActive={activeTab === 'crm-leads'} onClick={() => setActiveTab('crm-leads')} />
                  <NavItem icon={RefreshCw} label="Kalender-Integration" isActive={activeTab === 'calendar-integration'} onClick={() => setActiveTab('calendar-integration')} />
                </div>
                
                <NavItem icon={Send} label="Newsletter" isActive={activeTab === 'newsletter'} onClick={() => setActiveTab('newsletter')} />
                <NavItem icon={Edit} label="Content Editor" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                <NavItem icon={Link} label="Notion Integration" isActive={activeTab === 'notion'} onClick={() => setActiveTab('notion')} />
                <NavItem icon={Settings} label="Einstellungen" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                <NavItem icon={Activity} label="System-Diagnose" isActive={activeTab === 'diagnostic'} onClick={() => setActiveTab('diagnostic')} />
                <NavItem icon={Target} label="SEO Strategien" isActive={activeTab === 'seo'} onClick={() => setActiveTab('seo')} />
                <NavItem icon={FileText} label="Performance Monitoring" isActive={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
              </nav>

              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-bodensee-sublime text-white flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">A</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Administrator</p>
                    <p className="text-bodensee-mushroom text-xs">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-bodensee-bermuda-sand hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Abmelden
                </button>
              </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{currentTab.title}</h1>
                <p className="text-gray-600 text-xs lg:text-sm">{currentTab.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Dashboard durchsuchen (Ctrl+K)"
                data-testid="dashboard-search-button"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Help Button */}
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Hilfe & Dokumentation"
                data-testid="dashboard-help-button"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <NotificationBell />
              
              <div className="hidden sm:block text-xs lg:text-sm text-gray-500">
                Letzter Login: {new Date().toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 lg:p-6 pb-12 overflow-y-auto h-full">
          {renderTabContent()}
        </main>
      </div>

      {/* Search Modal */}
      <DashboardSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onTabChange={setActiveTab}
      />

      {/* Help Modal */}
      <DashboardHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onTabChange={setActiveTab}
      />
    </div>
  );
}