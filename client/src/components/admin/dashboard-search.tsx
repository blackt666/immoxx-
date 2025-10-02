import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Building, MessageSquare, Image, Mail, Settings, LayoutDashboard, Edit, Link, Activity, Target, FileText, BarChart3, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  tab?: string;
  keywords: string[];
}

interface DashboardSearchProps {
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSearch({ onTabChange, isOpen, onClose }: DashboardSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive search database with all dashboard functions
  const searchDatabase: SearchResult[] = [
    // Dashboard Overview
    {
      id: "dashboard",
      title: "Dashboard Übersicht",
      description: "Hauptübersicht mit Statistiken und Schnellaktionen",
      category: "Übersicht",
      icon: LayoutDashboard,
      tab: "dashboard",
      keywords: ["dashboard", "übersicht", "statistiken", "home", "start", "haupt"]
    },
    
    // Properties Management
    {
      id: "properties",
      title: "Immobilien verwalten",
      description: "Immobilien hinzufügen, bearbeiten und verwalten",
      category: "Immobilien",
      icon: Building,
      tab: "properties",
      keywords: ["immobilien", "properties", "häuser", "wohnungen", "objekte", "verkauf", "vermietung"]
    },
    
    // Gallery Management
    {
      id: "gallery",
      title: "Galerie verwalten",
      description: "Bilder und 360° Touren hochladen und organisieren",
      category: "Immobilien",
      icon: Image,
      tab: "gallery",
      keywords: ["galerie", "bilder", "fotos", "360", "touren", "media", "upload"]
    },
    
    // Inquiries Management
    {
      id: "inquiries",
      title: "Kundenanfragen",
      description: "Anfragen bearbeiten und verwalten",
      category: "CRM & Kunden",
      icon: MessageSquare,
      tab: "inquiries",
      keywords: ["anfragen", "inquiries", "kunden", "nachrichten", "kontakt", "leads"]
    },
    
    // Newsletter Management
    {
      id: "newsletter",
      title: "Newsletter",
      description: "Newsletter erstellen und versenden",
      category: "Marketing",
      icon: Mail,
      tab: "newsletter",
      keywords: ["newsletter", "email", "marketing", "versenden", "kampagne", "subscribers"]
    },
    
    // Content Editor
    {
      id: "content",
      title: "Content Editor",
      description: "Website-Inhalte bearbeiten und verwalten",
      category: "Marketing",
      icon: Edit,
      tab: "content",
      keywords: ["content", "editor", "texte", "inhalte", "website", "seiten", "bearbeiten"]
    },
    
    // Settings
    {
      id: "settings",
      title: "Einstellungen",
      description: "System-Konfiguration und Design-Management",
      category: "System",
      icon: Settings,
      tab: "settings",
      keywords: ["einstellungen", "settings", "konfiguration", "design", "theme", "farben", "profil"]
    },
    
    // Notion Integration
    {
      id: "notion",
      title: "Notion Integration",
      description: "Daten mit Notion synchronisieren",
      category: "System",
      icon: Link,
      tab: "notion",
      keywords: ["notion", "integration", "synchronisation", "crm", "verbindung"]
    },
    
    // System Diagnostic
    {
      id: "diagnostic",
      title: "System-Diagnose",
      description: "Vollständige Funktionsprüfung des Systems",
      category: "System",
      icon: Activity,
      tab: "diagnostic",
      keywords: ["diagnose", "diagnostic", "system", "check", "funktionsprüfung", "status"]
    },
    
    // SEO Strategies
    {
      id: "seo",
      title: "SEO Strategien",
      description: "SEO-Strategien verwalten und optimieren",
      category: "Marketing",
      icon: Target,
      tab: "seo",
      keywords: ["seo", "strategien", "optimization", "google", "ranking", "keywords"]
    },
    
    // Auto Generator
    {
      id: "auto-generator",
      title: "Auto-Generator",
      description: "Immobilienanzeigen automatisch erstellen",
      category: "Immobilien",
      icon: FileText,
      tab: "auto-generator",
      keywords: ["auto", "generator", "automatisch", "anzeigen", "ki", "ai", "erstellen"]
    },
    
    // Performance Monitoring
    {
      id: "performance",
      title: "Performance Monitoring",
      description: "Systemleistung überwachen und analysieren",
      category: "System",
      icon: BarChart3,
      tab: "performance",
      keywords: ["performance", "monitoring", "leistung", "geschwindigkeit", "analytics"]
    }
  ];

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = searchDatabase.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );

    setSearchResults(filtered);
  }, [searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    if (result.tab) {
      onTabChange(result.tab);
    }
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Dashboard durchsuchen... (z.B. 'Immobilien', 'Anfragen', 'Einstellungen')"
              className="pl-10 pr-10 py-3 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="search-input"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={onClose}
              data-testid="search-close-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === "" ? (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">Dashboard durchsuchen</p>
              <p className="text-sm">Geben Sie einen Suchbegriff ein, um Dashboard-Bereiche zu finden.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-lg mb-2">Keine Ergebnisse gefunden</p>
              <p className="text-sm">Versuchen Sie andere Suchbegriffe wie 'Immobilien', 'Kunden' oder 'Einstellungen'.</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  data-testid={`search-result-${result.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <result.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{result.title}</h3>
                      <p className="text-sm text-gray-600">{result.description}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {result.category}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Drücken Sie <kbd className="px-2 py-1 bg-white rounded border text-xs">ESC</kbd> zum Schließen
          </p>
        </div>
      </div>
    </div>
  );
}