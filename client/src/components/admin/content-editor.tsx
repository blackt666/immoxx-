import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useThemeConfig } from "@/contexts/ThemeConfigContext";
import ContentTemplates from "@/components/admin/content-templates";
import {
  Save,
  RotateCcw,
  Eye,
  Phone,
  Mail,
  MapPin,
  Clock,
  Image,
  Upload,
  Video,
  Type,
  Palette,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ContentSection {
  id: string;
  section: string;
  content: any;
  updatedAt: string;
}

// Placeholder for GalleryImage interface if not defined elsewhere
interface GalleryImage {
  id: string;
  filename: string;
  originalName?: string;
  category?: string;
  metadata?: { type?: string };
  size?: number;
}


export default function ContentEditor() {
  if (process.env.NODE_ENV === 'development') {
    console.log("🚀 ContentEditor component initializing...");
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contentData, setContentData] = useState({
    hero: {
      title: "",
      subtitle: "",
      ctaText: "",
      backgroundImage: "",
    },
    about: {
      description: "",
      experience: "",
      sales: "",
    },
    contact: {
      phone: "",
      mobile: "",
      email: "",
      address: "",
      hours: "",
    },
  });
  const [selectedHeroImage, setSelectedHeroImage] = useState<string>("");
  const [activePanel, setActivePanel] = useState<string>("content");
  const [componentError, setComponentError] = useState<string | null>(null);
  
  // FIXED: Move useThemeConfig() to top level (unconditional hook call)
  // React hooks must be called at the top level, never inside try/catch, loops, or conditions
  const themeConfig = useThemeConfig();
  const designSettings = themeConfig?.designSettings || null;
  const updateSettings = themeConfig?.updateSettings || null;
  const applyTheme = themeConfig?.applyTheme || null;
  const themeLoading = themeConfig?.isLoading || false;
  
  // FIXED: Handle theme errors in useEffect instead of during render
  useEffect(() => {
    if (!themeConfig || !designSettings) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ ThemeConfig not available, using fallback");
      }
      setComponentError("Theme configuration not available");
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ ThemeConfig loaded successfully");
      }
      setComponentError(null); // Clear error if theme becomes available
    }
  }, [themeConfig, designSettings]);

  // Galerie-Bilder laden für Hero-Auswahl with improved error handling
  const { data: galleryImages, isLoading: isLoadingGallery, error: galleryError } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("📸 Loading gallery images...");
      }
      try {
        const response = await fetch("/api/gallery", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Gallery API not available, using empty array");
          }
          return [];
        }

        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Gallery data loaded:", Array.isArray(data) ? data.length : 'invalid', 'items');
        }
        return Array.isArray(data) ? data : [];
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("⚠️ Gallery API error, using empty array:", error);
        }
        return [];
      }
    },
    select: (data) => {
      // Filter nur gültige Bilder und normale Bilder (keine 360°)
      const filtered = Array.isArray(data)
        ? data.filter(
            (image) =>
              image &&
              image.id &&
              image.category !== "360" &&
              image.metadata?.type !== "360",
          )
        : [];
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Filtered gallery images:", filtered.length, 'items');
      }
      return filtered;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: siteContent, isLoading, error: siteContentError } = useQuery<ContentSection[]>({
    queryKey: ["/api/site-content"],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("📄 Loading site content...");
      }
      try {
        const response = await fetch("/api/site-content", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Site content API not available");
          }
          return [];
        }

        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Site content loaded:", Array.isArray(data) ? data.length : 'invalid', 'sections');
        }
        return Array.isArray(data) ? data : [];
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("⚠️ Site content API error:", error);
        }
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle data updates when siteContent changes (replaces the removed onSuccess)
  useEffect(() => {
    if (siteContent && Array.isArray(siteContent)) {
      const contentMap = siteContent.reduce((acc: any, item: ContentSection) => {
        acc[item.section] = item.content;
        return acc;
      }, {} as any);

      setContentData({
        hero: contentMap.hero || {
          title: "Ihr Immobilienexperte am Bodensee",
          subtitle:
            "Mit über 20 Jahren Erfahrung begleiten wir Sie professionell beim Kauf und Verkauf Ihrer Traumimmobilie am Bodensee.",
          ctaText: "Kostenlose Bewertung",
          backgroundImage: "/uploads/hero-video.mp4",
        },
        about: contentMap.about || {
          description:
            "Als zertifizierter Immobilienmakler mit über 20 Jahren Erfahrung am Bodensee kenne ich den lokalen Markt wie kein anderer. Von Friedrichshafen bis Konstanz, von Meersburg bis Überlingen – ich unterstütze Sie mit persönlicher Beratung und professionellem Service bei allen Immobilienthemen.",
          experience: "20",
          sales: "200",
        },
        contact: contentMap.contact || {
          phone: "07541 / 371648",
          mobile: "0160 / 8066630",
          email: "mueller@bimm-fn.de",
          address: "Seewiesenstraße 31/6, 88046 Friedrichshafen",
          hours: "Mo-Fr 9-18h, Sa 10-14h",
        },
      });
    }
  }, [siteContent]);

  const updateContentMutation = useMutation({
    mutationFn: async ({
      section,
      content,
    }: {
      section: string;
      content: any;
    }) => {
      const response = await fetch(`/api/admin/site-content/${section}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(content),
      });
      if (!response.ok) {
        throw new Error("Failed to update content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-content"] });
      toast({
        title: "Inhalte gespeichert",
        description: "Die Website-Inhalte wurden erfolgreich aktualisiert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Inhalte konnten nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        updateContentMutation.mutateAsync({
          section: "hero",
          content: contentData.hero,
        }),
        updateContentMutation.mutateAsync({
          section: "about",
          content: contentData.about,
        }),
        updateContentMutation.mutateAsync({
          section: "contact",
          content: contentData.contact,
        }),
      ]);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleReset = () => {
    setContentData({
      hero: {
        title: "Ihr Immobilienexperte am Bodensee",
        subtitle:
          "Mit über 20 Jahren Erfahrung begleiten wir Sie professionell beim Kauf und Verkauf Ihrer Traumimmobilie am Bodensee.",
        ctaText: "Kostenlose Bewertung",
        backgroundImage: "/uploads/hero-video.mp4",
      },
      about: {
        description:
          "Als zertifizierter Immobilienmakler mit über 20 Jahren Erfahrung am Bodensee kenne ich den lokalen Markt wie kein anderer. Von Friedrichshafen bis Konstanz, von Meersburg bis Überlingen – ich unterstütze Sie mit persönlicher Beratung und professionellem Service bei allen Immobilienthemen.",
        experience: "20",
        sales: "200",
      },
      contact: {
        phone: "07541 / 371648",
        mobile: "0160 / 8066630",
        email: "mueller@bimm-fn.de",
        address: "Seewiesenstraße 31/6, 88046 Friedrichshafen",
        hours: "Mo-Fr 9-18h, Sa 10-14h",
      },
    });
  };

  const handleHeroImageSelect = async (imageId: string) => {
    const selectedImage = galleryImages?.find(img => img.id === imageId);

    if (!selectedImage) {
      toast({
        title: "Fehler",
        description: "Bild konnte nicht gefunden werden",
        variant: "destructive",
      });
      return;
    }

    // Verwende die korrekte API-URL für das Bild
    const imageUrl = `/api/gallery/${imageId}/image`;

    // Update local state for immediate preview
    const updatedHeroContent = {
      ...contentData.hero,
      backgroundImage: imageUrl,
    };

    setContentData((prev) => ({
      ...prev,
      hero: updatedHeroContent,
    }));
    setSelectedHeroImage(imageId);

    // Save to backend immediately for live updates
    try {
      await updateContentMutation.mutateAsync({
        section: "hero",
        content: updatedHeroContent,
      });

      // Invalidate the site content query to trigger immediate updates on landing page
      queryClient.invalidateQueries({ queryKey: ["/api/site-content"] });

      toast({
        title: "Hero-Bild gespeichert",
        description: `"${selectedImage?.originalName || selectedImage?.filename || 'Bild'}" wurde als Hero-Bild gesetzt und gespeichert`,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to save hero background:", error);
      }
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Das Hero-Bild wurde ausgewählt, aber nicht gespeichert. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  // Error boundary for component initialization
  if (componentError || siteContentError || galleryError) {
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ ContentEditor errors:", { componentError, siteContentError, galleryError });
    }
    return (
      <div className="space-y-6" data-testid="content-editor-error">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              ⚠️ Content Editor Fehler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-red-700">
              <p className="mb-2">Der Content Editor konnte nicht vollständig geladen werden:</p>
              <ul className="list-disc pl-5 space-y-1">
                {componentError && <li>Theme-Konfiguration: {componentError}</li>}
                {siteContentError && <li>Site-Content API: {String(siteContentError)}</li>}
                {galleryError && <li>Galerie API: {String(galleryError)}</li>}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                data-testid="button-reload"
              >
                🔄 Seite neu laden
              </Button>
              <Button 
                onClick={() => {
                  setComponentError(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/site-content"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
                }}
                data-testid="button-retry"
              >
                🔧 Erneut versuchen
              </Button>
            </div>
            <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
              <strong>Debug Info:</strong> Content Editor ist trotz Fehlern teilweise funktionsfähig. 
              Überprüfen Sie die Browser-Konsole für weitere Details.
            </div>
          </CardContent>
        </Card>
        
        {/* Fallback minimal editor */}
        <Card className="border-orange-200" data-testid="fallback-editor">
          <CardHeader>
            <CardTitle className="text-orange-800">🛠️ Fallback Content Editor</CardTitle>
            <p className="text-sm text-orange-600">Einfache Version des Content Editors</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fallback-title">Titel</Label>
              <Input
                id="fallback-title"
                placeholder="Website Titel eingeben..."
                data-testid="input-fallback-title"
              />
            </div>
            <div>
              <Label htmlFor="fallback-content">Inhalt</Label>
              <Textarea
                id="fallback-content"
                placeholder="Website Inhalt eingeben..."
                rows={4}
                data-testid="textarea-fallback-content"
              />
            </div>
            <Button data-testid="button-fallback-save">
              💾 Speichern (Fallback-Modus)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || themeLoading) {
    return (
      <div className="space-y-6" data-testid="content-editor-loading">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="text-center text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Content Editor wird geladen...
          </div>
        </div>
      </div>
    );
  }

  const [showTemplates, setShowTemplates] = useState(false);
  
  // Font options for the font panel
  const fontOptions = [
    { name: "Inter", value: "Inter, sans-serif", category: "Sans-serif" },
    { name: "Roboto", value: "Roboto, sans-serif", category: "Sans-serif" },
    { name: "Open Sans", value: "'Open Sans', sans-serif", category: "Sans-serif" },
    { name: "Lato", value: "Lato, sans-serif", category: "Sans-serif" },
    { name: "Playfair Display", value: "'Playfair Display', serif", category: "Serif" },
    { name: "Merriweather", value: "Merriweather, serif", category: "Serif" },
    { name: "Georgia", value: "Georgia, serif", category: "Serif" },
    { name: "Times New Roman", value: "'Times New Roman', serif", category: "Serif" },
  ];
  
  // Bodensee brand colors for the color panel
  const brandColors = [
    { name: "Bodensee Tiefe", value: "#566873", category: "Primary" },
    { name: "Bodensee Wasser", value: "#65858C", category: "Primary" },
    { name: "Bodensee Sand", value: "#D9CDBF", category: "Neutral" },
    { name: "Bodensee Steine", value: "#8C837B", category: "Neutral" },
    { name: "Bodensee Ufer", value: "#BFADA3", category: "Neutral" },
    { name: "Weiß", value: "#FFFFFF", category: "Basic" },
    { name: "Schwarz", value: "#000000", category: "Basic" },
    { name: "Grau Hell", value: "#F5F5F5", category: "Basic" },
    { name: "Grau Mittel", value: "#9CA3AF", category: "Basic" },
    { name: "Grau Dunkel", value: "#374151", category: "Basic" },
  ];

  const contentTemplates = {
    hero: [
      {
        name: "Luxus Villa",
        template: {
          title: "Exklusive Luxusvillen am Bodensee",
          subtitle: "Entdecken Sie einzigartige Immobilien mit Seeblick in bester Lage",
          ctaText: "Jetzt entdecken"
        }
      },
      {
        name: "Apartment Modern",
        template: {
          title: "Moderne Apartments in Seenähe",
          subtitle: "Stilvolles Wohnen mit perfekter Anbindung an den Bodensee",
          ctaText: "Besichtigung vereinbaren"
        }
      }
    ],
    about: [
      {
        name: "Erfahrung betonen",
        template: {
          description: "Mit über 25 Jahren Erfahrung am Bodensee sind wir Ihr vertrauensvoller Partner für Immobilien.",
          experience: "25",
          sales: "500"
        }
      },
      {
        name: "Lokale Expertise",
        template: {
          description: "Als gebürtiger Bodenseer kenne ich jeden Winkel der Region und finde für Sie die perfekte Immobilie.",
          experience: "20",
          sales: "350"
        }
      }
    ]
  };

  const applyTemplate = (section: string, template: any) => {
    const updatedContent = {
      ...contentData,
      [section as keyof typeof contentData]: { ...contentData[section as keyof typeof contentData], ...template.template }
    };
    setContentData(updatedContent);
    setShowTemplates(false);

    toast({
      title: "Vorlage angewendet",
      description: `${template.name} wurde erfolgreich angewendet`
    });
  };
  
  // Handle template selection from ContentTemplates component
  const handleTemplateSelect = (template: any) => {
    // Apply template content to appropriate section
    if (template.content.hero) {
      setContentData(prev => ({
        ...prev,
        hero: { ...prev.hero, ...template.content.hero }
      }));
    }
    if (template.content.about) {
      setContentData(prev => ({
        ...prev,
        about: { ...prev.about, ...template.content.about }
      }));
    }
    if (template.content.contact) {
      setContentData(prev => ({
        ...prev,
        contact: { ...prev.contact, ...template.content.contact }
      }));
    }
    
    
    toast({
      title: "Template angewendet",
      description: `${template.name} wurde erfolgreich angewendet`
    });
  };
  
  // Handle font changes
  const handleFontChange = async (fontFamily: string) => {
    if (!designSettings) return;
    
    const updatedSettings = {
      ...designSettings,
      light: {
        ...designSettings.light,
        typography: {
          ...designSettings.light.typography,
          fontFamily: fontFamily
        }
      }
    };
    
    try {
      await updateSettings(updatedSettings);
      applyTheme(updatedSettings);
      
      toast({
        title: "Schriftart gespeichert",
        description: `Schriftart wurde zu ${fontFamily.split(',')[0]} geändert`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Schriftart konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  // Handle color changes
  const handleColorChange = async (colorKey: string, colorValue: string) => {
    if (!designSettings) return;
    
    const updatedSettings = {
      ...designSettings,
      light: {
        ...designSettings.light,
        colors: {
          ...designSettings.light.colors,
          [colorKey]: colorValue
        }
      }
    };
    
    try {
      await updateSettings(updatedSettings);
      applyTheme(updatedSettings);
      
      toast({
        title: "Farbe gespeichert",
        description: `${colorKey} wurde aktualisiert`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Farbe konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  // Component loaded successfully
  if (process.env.NODE_ENV === 'development') {
    console.log("✅ ContentEditor component loaded successfully!");
  }

  return (
    <div className="space-y-6" data-testid="content-editor-main">
      {/* Success indicator for debugging */}
      <div className="sr-only" data-testid="content-editor-loaded">Content Editor loaded</div>
      
      {/* Control Panel Tabs */}
      <Card className="border border-gray-200" data-testid="content-editor-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900" data-testid="content-editor-title">
                Website Content Editor
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1" data-testid="content-editor-subtitle">
                Bearbeiten Sie Inhalte, Schriftarten, Farben und Templates
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activePanel} onValueChange={setActivePanel} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content" className="flex items-center gap-2" data-testid="tab-content">
                <FileText className="w-4 h-4" />
                Inhalte
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2" data-testid="tab-fonts">
                <Type className="w-4 h-4" />
                Schriftarten
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2" data-testid="tab-colors">
                <Palette className="w-4 h-4" />
                Farben
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
                <Image className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>
            
            {/* Content Panel */}
            <TabsContent value="content" className="space-y-6 mt-6" data-testid="panel-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Sections */}
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hero-Sektion
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heroTitle">Haupt-Überschrift</Label>
                    <Input
                      id="heroTitle"
                      value={contentData.hero.title}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, title: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heroSubtitle">Untertitel</Label>
                    <Textarea
                      id="heroSubtitle"
                      rows={3}
                      value={contentData.hero.subtitle}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, subtitle: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heroCta">CTA Button Text</Label>
                    <Input
                      id="heroCta"
                      value={contentData.hero.ctaText}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, ctaText: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  {/* Hero Hintergrundbild */}
                  <div>
                    <Label>Hintergrundbild / Video</Label>
                    <div className="mt-2 space-y-4">
                      {/* Aktuelles Bild anzeigen */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">Aktuell:</p>
                        {contentData.hero.backgroundImage ? (
                          <div className="flex items-center space-x-3">
                            {contentData.hero.backgroundImage.endsWith(
                              ".mp4",
                            ) ? (
                              <Video className="w-8 h-8 text-gray-500" />
                            ) : (
                              <Image className="w-8 h-8 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700">
                              {contentData.hero.backgroundImage
                                .split("/")
                                .pop()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Kein Bild ausgewählt
                          </span>
                        )}
                      </div>

                      {/* Erweiterte Galerie-Auswahl */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">
                            Hero-Bild aus Galerie wählen{" "}
                            {galleryImages && `(${galleryImages.length} Bilder verfügbar)`}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('/admin?tab=gallery', '_blank')}
                            className="text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Galerie verwalten
                          </Button>
                        </div>

                        {isLoadingGallery ? (
                          <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600">
                              Lade Galerie-Bilder...
                            </span>
                          </div>
                        ) : galleryImages && galleryImages.length > 0 ? (
                          <div className="space-y-4">
                            {/* Template Selection for Hero */}
                            <div className="border rounded-lg bg-gray-50 p-3">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Vorlagen für Hero
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowTemplates(!showTemplates)}
                                >
                                  {showTemplates ? "Schließen" : "Öffnen"}
                                </Button>
                              </div>
                              {showTemplates && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {contentTemplates.hero.map((template) => (
                                    <Button
                                      key={template.name}
                                      variant="outline"
                                      className="justify-start"
                                      onClick={() => applyTemplate("hero", template)}
                                    >
                                      {template.name}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>


                            {/* Aktuelles Hero-Bild Vorschau */}
                            {contentData.hero.backgroundImage && (
                              <div className="bg-gray-50 rounded-lg border p-4">
                                <p className="text-xs font-medium text-gray-600 mb-2">Aktuelles Hero-Bild:</p>
                                <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border">
                                  {contentData.hero.backgroundImage.endsWith('.mp4') ? (
                                    <div className="flex items-center justify-center h-full bg-gray-200">
                                      <div className="text-center">
                                        <Video className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                                        <span className="text-sm text-gray-600">Video-Hintergrund</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={contentData.hero.backgroundImage}
                                      alt="Hero-Hintergrund"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="flex items-center justify-center h-full bg-gray-200">
                                              <div class="text-center">
                                                <svg class="w-8 h-8 mx-auto mb-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                                </svg>
                                                <span class="text-sm text-gray-600">Bild nicht verfügbar</span>
                                              </div>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  )}

                                  {/* Overlay mit Bildinfo */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <span className="text-white text-sm font-medium">
                                      {contentData.hero.backgroundImage.split('/').pop()?.replace(/\.[^/.]+$/, "") || "Hero-Bild"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Verbesserte Galerie-Grid */}
                            <div className="border rounded-lg bg-gray-50">
                              <div className="p-3 border-b bg-white rounded-t-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">
                                    Verfügbare Bilder wählen
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Klicken zum Auswählen
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-3 p-3 max-h-80 overflow-y-auto">
                                {galleryImages.map((image: any) => {
                                  const isSelected = selectedHeroImage === image.id ||
                                    contentData.hero.backgroundImage?.includes(image.id);

                                  return (
                                    <button
                                      key={image.id}
                                      onClick={() => handleHeroImageSelect(image.id)}
                                      className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                                        isSelected
                                          ? "border-blue-500 ring-2 ring-blue-200 shadow-lg scale-105"
                                          : "border-gray-200 hover:border-blue-300"
                                      }`}
                                      title={`${image.originalName || image.filename} - Klicken zum Auswählen als Hero-Bild`}
                                    >
                                      <img
                                        src={`/api/gallery/${image.id}/image`}
                                        alt={image.originalName || image.filename}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent && !parent.querySelector('.error-placeholder')) {
                                            const errorDiv = document.createElement('div');
                                            errorDiv.className = 'error-placeholder absolute inset-0 flex items-center justify-center bg-gray-200';
                                            errorDiv.innerHTML = `
                                              <div class="text-center">
                                                <svg class="w-6 h-6 mx-auto mb-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                                </svg>
                                                <span class="text-xs text-gray-500">Fehler</span>
                                              </div>
                                            `;
                                            parent.appendChild(errorDiv);
                                          }
                                        }}
                                      />

                                      {/* Verbessertes Overlay */}
                                      <div className={`absolute inset-0 transition-all duration-200 ${
                                        isSelected
                                          ? "bg-blue-500/30 opacity-100"
                                          : "bg-black/0 hover:bg-black/20 opacity-0 hover:opacity-100"
                                      }`} />

                                      {/* Ausgewählt-Indikator */}
                                      {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}

                                      {/* Verbesserte Dateiname-Anzeige */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                                        <span className="text-white text-xs font-medium truncate block">
                                          {image.originalName?.replace(/\.[^/.]+$/, "") || image.filename || 'Unbenannt'}
                                        </span>
                                        {image.size && (
                                          <span className="text-white/80 text-xs">
                                            {(image.size / 1024).toFixed(1)} KB
                                          </span>
                                        )}
                                      </div>

                                      {/* Kategorie-Badge */}
                                      {image.category && image.category !== 'general' && (
                                        <div className="absolute top-2 left-2">
                                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                            {image.category === '360' ? '360°' : image.category}
                                          </span>
                                        </div>
                                      )}

                                      {/* Auswahl-Indikator Ecke */}
                                      <div className="absolute top-2 right-2">
                                        <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                                          isSelected
                                            ? "bg-blue-500 border-white scale-110"
                                            : "bg-white/80 border-gray-300 hover:border-blue-300"
                                        }`}>
                                          {isSelected && (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border">
                            <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 font-medium mb-1">
                              Keine Bilder in der Galerie
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                              Laden Sie zuerst Bilder in die Galerie hoch
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('/admin?tab=gallery', '_blank')}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Zur Galerie-Verwaltung
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Aktions-Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setContentData((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                backgroundImage: "/uploads/hero-video.mp4",
                              },
                            }));
                            setSelectedHeroImage("");
                            toast({
                              title: "Standard Video gesetzt",
                              description: "Hero-Video wurde auf Standard zurückgesetzt",
                            });
                          }}
                          className="flex-1"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Standard Video
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (contentData.hero.backgroundImage) {
                              window.open(contentData.hero.backgroundImage, '_blank');
                            } else {
                              toast({
                                title: "Kein Bild gesetzt",
                                description: "Wählen Sie zuerst ein Bild aus",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Vorschau
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Über uns Sektion
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aboutDescription">Beschreibung</Label>
                    <Textarea
                      id="aboutDescription"
                      rows={6}
                      value={contentData.about.description}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          about: { ...prev.about, description: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">Jahre Erfahrung</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={contentData.about.experience}
                        onChange={(e) =>
                          setContentData((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              experience: e.target.value,
                            },
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sales">Verkaufte Immobilien</Label>
                      <Input
                        id="sales"
                        type="number"
                        value={contentData.about.sales}
                        onChange={(e) =>
                          setContentData((prev) => ({
                            ...prev,
                            about: { ...prev.about, sales: e.target.value },
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>

                   {/* Template Selection for About */}
                  <div className="border rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Vorlagen für Über uns
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplates(!showTemplates)}
                      >
                        {showTemplates ? "Schließen" : "Öffnen"}
                      </Button>
                    </div>
                    {showTemplates && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contentTemplates.about.map((template) => (
                          <Button
                            key={template.name}
                            variant="outline"
                            className="justify-start"
                            onClick={() => applyTemplate("about", template)}
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Contact Information */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kontaktdaten
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Haupttelefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contentData.contact.phone}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobil</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={contentData.contact.mobile}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, mobile: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contentData.contact.email}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={contentData.contact.address}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, address: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hours">Öffnungszeiten</Label>
                    <Input
                      id="hours"
                      value={contentData.contact.hours}
                      onChange={(e) =>
                        setContentData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, hours: e.target.value },
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Live-Vorschau
                </h3>

                {/* Mini Hero Preview */}
                <div
                  className="relative rounded-lg p-6 text-white mb-4 bg-cover bg-center min-h-[200px] flex flex-col justify-center"
                  style={{
                    backgroundImage: contentData.hero.backgroundImage
                      ? `linear-gradient(rgba(86, 104, 115, 0.7), rgba(101, 133, 140, 0.7)), url(${contentData.hero.backgroundImage})`
                      : 'linear-gradient(135deg, var(--ruskin-blue), var(--arctic-blue))'
                  }}
                >
                  <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-2">
                      {contentData.hero.title}
                    </h2>
                    <p className="text-sm opacity-90 mb-4">
                      {contentData.hero.subtitle}
                    </p>
                    <button className="bg-white text-[var(--ruskin-blue)] px-4 py-2 rounded-lg text-sm font-medium">
                      {contentData.hero.ctaText}
                    </button>
                  </div>
                </div>

                {/* Mini About Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Über uns</h3>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {contentData.about.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>{contentData.about.experience}+ Jahre Erfahrung</span>
                    <span>{contentData.about.sales}+ Verkaufte Immobilien</span>
                  </div>
                </div>

                {/* Mini Contact Preview */}
                <div className="bg-[var(--bermuda-sand)]/30 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Kontakt</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{contentData.contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{contentData.contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{contentData.contact.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{contentData.contact.hours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Actions */}
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={updateContentMutation.isPending}
                  className="bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateContentMutation.isPending
                    ? "Speichern..."
                    : "Änderungen speichern"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Zurücksetzen
                </Button>
                <Button
                  onClick={() => window.open("/", "_blank")}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Website öffnen
                </Button>
              </div>
              </div>
            </div>
            
            {/* Font Panel */}
            <TabsContent value="fonts" className="space-y-4" data-testid="panel-fonts">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Schriftarten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => handleFontChange(font.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          designSettings?.light.typography?.fontFamily === font.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ fontFamily: font.value }}
                        data-testid={`font-${font.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="font-medium">{font.name}</div>
                        <div className="text-sm text-gray-500">Aa</div>
                      </button>
                    ))}
                  </div>
                  {/* Live Preview */}
                  {designSettings?.light.typography?.fontFamily && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div style={{ fontFamily: designSettings.light.typography.fontFamily }}>
                        <h3 className="text-lg font-bold">Bodensee Immobilien Müller</h3>
                        <p className="text-sm text-gray-600">Live-Vorschau der gewählten Schriftart</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Color Panel */}
            <TabsContent value="colors" className="space-y-4" data-testid="panel-colors">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Farben
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Bodensee Brand Farben</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {brandColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleColorChange('primary', color.value)}
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              designSettings?.light.colors?.primary === color.value 
                                ? 'border-blue-500 scale-110' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            data-testid={`color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Color Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Label className="text-sm font-medium mb-2 block">Aktuelle Farben</Label>
                      <div className="flex gap-3">
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: 'var(--primary)' }} />
                          <p className="text-xs mt-1">Primary</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: 'var(--secondary)' }} />
                          <p className="text-xs mt-1">Secondary</p>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: 'var(--accent)' }} />
                          <p className="text-xs mt-1">Accent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Templates Panel */}
            <TabsContent value="templates" className="space-y-4" data-testid="panel-templates">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ContentTemplates onTemplateSelect={handleTemplateSelect} />
                </CardContent>
              </Card>
            </TabsContent>
          </TabsContent>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={updateContentMutation.isPending}
                className="bg-[var(--bodensee-water)] hover:bg-[var(--bodensee-water)]/90"
                data-testid="button-save-content"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateContentMutation.isPending ? "Speichern..." : "Änderungen speichern"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-300"
                data-testid="button-reset-content"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
            </div>
            <Button
              onClick={() => window.open("/", "_blank")}
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-preview-website"
            >
              <Eye className="w-4 h-4 mr-2" />
              Website öffnen
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  </div>
  );
}