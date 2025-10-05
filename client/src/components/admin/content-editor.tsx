import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeConfig } from "@/contexts/ThemeConfigContext";
import ContentTemplates from "@/components/admin/content-templates";
import {
  Save,
  RotateCcw,
  Eye,
  Image,
  Upload,
  Video,
  Type,
  Palette,
  FileText,
} from "lucide-react";
import { DesignSettings } from "@/types/admin";

interface ContentSection {
  id: string;
  section: string;
  content: Record<string, unknown>;
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
  
  const themeConfig = useThemeConfig();
  const designSettings = themeConfig?.designSettings || null;
  const updateSettings = themeConfig?.updateSettings || null;
  const applyTheme = themeConfig?.applyTheme || null;
  const themeLoading = themeConfig?.isLoading || false;
  
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

  useEffect(() => {
    if (siteContent && Array.isArray(siteContent)) {
      const contentMap = siteContent.reduce((acc: Record<string, Record<string, unknown>>, item: ContentSection) => {
        acc[item.section] = item.content;
        return acc;
      }, {});

      setContentData({
        hero: (contentMap.hero as typeof contentData.hero) || {
          title: "Ihr Immobilienexperte am Bodensee",
          subtitle:
            "Mit über 20 Jahren Erfahrung begleiten wir Sie professionell beim Kauf und Verkauf Ihrer Traumimmobilie am Bodensee.",
          ctaText: "Kostenlose Bewertung",
          backgroundImage: "/uploads/hero-video.mp4",
        },
        about: (contentMap.about as typeof contentData.about) || {
          description:
            "Als zertifizierter Immobilienmakler mit über 20 Jahren Erfahrung am Bodensee kenne ich den lokalen Markt wie kein anderer. Von Friedrichshafen bis Konstanz, von Meersburg bis Überlingen – ich unterstütze Sie mit persönlicher Beratung und professionellem Service bei allen Immobilienthemen.",
          experience: "20",
          sales: "200",
        },
        contact: (contentMap.contact as typeof contentData.contact) || {
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
      content: Record<string, unknown>;
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
    } catch {
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

    const imageUrl = `/api/gallery/${imageId}/image`;

    const updatedHeroContent = {
      ...contentData.hero,
      backgroundImage: imageUrl,
    };

    setContentData((prev) => ({
      ...prev,
      hero: updatedHeroContent,
    }));
    setSelectedHeroImage(imageId);

    try {
      await updateContentMutation.mutateAsync({
        section: "hero",
        content: updatedHeroContent,
      });

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

  const applyTemplate = (section: string, template: { name: string; template: Record<string, unknown> }) => {
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
  
  interface DownloadContent {
    hero?: { title?: string; subtitle?: string; backgroundImage?: string };
    about?: { title?: string; description?: string };
    contact?: { title?: string; address?: string; phone?: string; email?: string };
  }
  
  interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    content: DownloadContent;
    preview: string;
    downloadContent: DownloadContent;
  }
  
  const handleTemplateSelect = (template: Template) => {
    const content = template.downloadContent || template.content;
    
    if (content.hero) {
      setContentData(prev => ({
        ...prev,
        hero: { ...prev.hero, ...content.hero }
      }));
    }
    if (content.about) {
      setContentData(prev => ({
        ...prev,
        about: { ...prev.about, ...content.about }
      }));
    }
    if (content.contact) {
      setContentData(prev => ({
        ...prev,
        contact: { ...prev.contact, ...content.contact }
      }));
    }
    
    
    toast({
      title: "Template angewendet",
      description: `${template.name} wurde erfolgreich angewendet`
    });
  };
  
  const handleFontChange = async (fontFamily: string) => {
    if (!designSettings || !updateSettings || !applyTheme) return;
    
    const updatedSettings: DesignSettings = {
      ...designSettings,
      fontFamily,
      light: {
        ...(designSettings as unknown as Record<string, Record<string, unknown>>).light,
        typography: {
          ...((designSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light?.typography || {}),
          fontFamily: fontFamily
        }
      },
      dark: {
        ...(designSettings as unknown as Record<string, Record<string, unknown>>).dark,
        typography: {
          ...((designSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).dark?.typography || {}),
          fontFamily: fontFamily
        }
      }
    } as unknown as DesignSettings;
    
    try {
      await updateSettings(updatedSettings);
      applyTheme(updatedSettings);
      
      toast({
        title: "Schriftart gespeichert",
        description: `Schriftart wurde zu ${fontFamily.split(',')[0]} geändert`
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Schriftart konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  const handleColorChange = async (colorKey: string, colorValue: string) => {
    if (!designSettings || !updateSettings || !applyTheme) return;
    
    const updatedSettings: DesignSettings = {
      ...designSettings,
      light: {
        ...(designSettings as unknown as Record<string, Record<string, unknown>>).light,
        colors: {
          ...((designSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).light?.colors || {}),
          [colorKey]: colorValue
        }
      },
      dark: {
        ...(designSettings as unknown as Record<string, Record<string, unknown>>).dark,
        colors: {
          ...((designSettings as unknown as Record<string, Record<string, Record<string, unknown>>>).dark?.colors || {}),
          [colorKey]: colorValue
        }
      }
    } as unknown as DesignSettings;
    
    try {
      await updateSettings(updatedSettings);
      applyTheme(updatedSettings);
      
      toast({
        title: "Farbe gespeichert",
        description: `${colorKey} wurde aktualisiert`
      });
    } catch {
      toast({
        title: "Fehler",
        description: "Farbe konnte nicht gespeichert werden",
        variant: "destructive"
      });
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.log("✅ ContentEditor component loaded successfully!");
  }

  return (
    <div className="space-y-6" data-testid="content-editor-main">
      <div className="sr-only" data-testid="content-editor-loaded">Content Editor loaded</div>
      
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
            
            <TabsContent value="content" className="space-y-6 mt-6" data-testid="panel-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
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

                  <div>
                    <Label>Hintergrundbild / Video</Label>
                    <div className="mt-2 space-y-4">
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

                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <span className="text-white text-sm font-medium">
                                      {contentData.hero.backgroundImage.split('/').pop()?.replace(/\.[^/.]+$/, "") || "Hero-Bild"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

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
                                {galleryImages.map((image: GalleryImage) => {
                                  const isSelected = selectedHeroImage === image.id ||
                                    (contentData.hero.backgroundImage &&
                                      contentData.hero.backgroundImage.includes(image.id));
                                      
                                  return (
                                    <button
                                      key={image.id}
                                      type="button"
                                      onClick={() => handleHeroImageSelect(image.id)}
                                      className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        isSelected
                                          ? "border-blue-600 ring-2 ring-blue-300"
                                          : "border-gray-200 hover:border-blue-400"
                                      }`}
                                    >
                                      <img
                                        src={`/api/gallery/${image.id}/image`}
                                        alt={image.originalName || image.filename}
                                        className="w-full h-full object-cover"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-blue-600 bg-opacity-50 flex items-center justify-center">
                                          <svg
                                            className="w-6 h-6 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border">
                            <p className="text-sm text-gray-600">
                              Keine Bilder in der Galerie gefunden.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Über-Uns-Sektion
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aboutDescription">Beschreibung</Label>
                    <Textarea
                      id="aboutDescription"
                      rows={5}
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
                      <Label htmlFor="aboutExperience">Jahre Erfahrung</Label>
                      <Input
                        id="aboutExperience"
                        type="number"
                        value={contentData.about.experience}
                        onChange={(e) =>
                          setContentData((prev) => ({
                            ...prev,
                            about: { ...prev.about, experience: e.target.value },
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="aboutSales">Verkäufe</Label>
                      <Input
                        id="aboutSales"
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
                </div>
              </div>
            </div>

            {/* Contact & Preview */}
            <div className="space-y-6">
              {/* Contact Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kontakt-Sektion
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">Telefon</Label>
                      <Input
                        id="contactPhone"
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
                      <Label htmlFor="contactMobile">Mobil</Label>
                      <Input
                        id="contactMobile"
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
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">E-Mail</Label>
                    <Input
                      id="contactEmail"
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
                    <Label htmlFor="contactAddress">Adresse</Label>
                    <Input
                      id="contactAddress"
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
                    <Label htmlFor="contactHours">Öffnungszeiten</Label>
                    <Input
                      id="contactHours"
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 p-4 bg-gray-50 rounded-lg border">
                <Button
                  variant="outline"
                  onClick={() => window.open("/", "_blank")}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Vorschau
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Zurücksetzen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateContentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateContentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Speichern
                </Button>
              </div>
            </div>
          </div>
            </TabsContent>
            
            {/* Fonts Panel */}
            <TabsContent value="fonts" className="mt-6" data-testid="panel-fonts">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Font Selection */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Schriftart auswählen</h3>
                  <div className="space-y-4">
                    {fontOptions.map(font => (
                      <button
                        key={font.value}
                        onClick={() => handleFontChange(font.value)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          (designSettings as unknown as Record<string, Record<string, Record<string, string>>>)?.light?.typography?.fontFamily === font.value
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-gray-800">{font.name}</p>
                        <p className="text-sm text-gray-500">{font.category}</p>
                        <p className="mt-2 text-lg" data-font-preview={font.value}>
                          The quick brown fox jumps over the lazy dog.
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Font Preview */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Live-Vorschau</h3>
                  {designSettings && (
                    <div className="border rounded-lg p-6 space-y-4 bg-white" data-font-family={(designSettings as unknown as Record<string, Record<string, Record<string, string>>>)?.light?.typography?.fontFamily}>
                      <h1 className="text-4xl font-bold">Überschrift 1</h1>
                      <h2 className="text-3xl font-semibold">Überschrift 2</h2>
                      <h3 className="text-2xl font-semibold">Überschrift 3</h3>
                      <p className="text-base">
                        Dies ist ein Beispieltext, der die ausgewählte Schriftart verwendet. Er zeigt, wie Fließtext auf Ihrer Website aussehen wird.
                      </p>
                      <p className="text-sm text-gray-600">
                        Ein kleinerer Text für Bildunterschriften oder sekundäre Informationen.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Colors Panel */}
            <TabsContent value="colors" className="mt-6" data-testid="panel-colors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Color Palette */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Farbpalette anpassen</h3>
                  {designSettings && (
                    <div className="space-y-4">
                      {Object.entries((designSettings as unknown as Record<string, Record<string, Record<string, string>>>)?.light?.colors || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md border" data-bg-color={value} />
                            <span className="text-sm font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={String(value)}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              className="w-12 h-8 p-1"
                            />
                            <Input
                              type="text"
                              value={String(value)}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Color Preview */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Live-Vorschau</h3>
                  <div className="border rounded-lg p-6 bg-[var(--background)] text-[var(--foreground)] space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--primary)]">Primärfarbe</h2>
                    <p>Dies ist ein Beispieltext mit der Standard-Vordergrundfarbe.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-[var(--card)] text-[var(--card-foreground)] border">
                        <h4 className="font-semibold">Kartenhintergrund</h4>
                        <p className="text-sm">Text auf einer Karte.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-[var(--secondary)] text-[var(--secondary-foreground]">
                        <h4 className="font-semibold">Sekundärfarbe</h4>
                        <p className="text-sm">Text auf sekundärem Hintergrund.</p>
                      </div>
                    </div>
                    <Button>Primärer Button</Button>
                    <Button variant="secondary">Sekundärer Button</Button>
                    <Button variant="destructive">Destruktiver Button</Button>
                    <div className="p-4 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                      <p>Dies ist ein gedämpfter Textbereich.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Templates Panel */}
            <TabsContent value="templates" className="mt-6" data-testid="panel-templates">
              <ContentTemplates onTemplateSelect={handleTemplateSelect} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}