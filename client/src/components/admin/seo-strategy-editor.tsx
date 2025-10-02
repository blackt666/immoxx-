
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Save, Plus, Trash2, Target, TrendingUp, Sparkles, Wand2, Brain } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// SEO Strategy Types
interface SEOStrategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sections: {
    [key: string]: {
      title: string;
      description: string;
      keywords: string;
      ogTitle?: string;
      ogDescription?: string;
      twitterTitle?: string;
      twitterDescription?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Default SEO content from existing codebase
const DEFAULT_SEO_CONTENT = {
  home: {
    title: "Bodensee Immobilien Müller | Immobilienmakler für die Bodenseeregion",
    description: "Ihr Experte für Immobilien am Bodensee. Über 20 Jahre Erfahrung in der Vermittlung von Wohnungen, Häusern und Villen in Friedrichshafen und Umgebung.",
    keywords: "Immobilienmakler Bodensee, Wohnung kaufen Bodensee, Haus verkaufen Friedrichshafen, Immobilienbewertung Bodensee, Immobilienmakler Friedrichshafen, 360° Touren",
    ogTitle: "Bodensee Immobilien Müller | Ihre Traumimmobilie am See",
    ogDescription: "Professionelle Immobilienberatung am Bodensee mit über 20 Jahren Erfahrung. Jetzt Traumimmobilie finden oder verkaufen.",
    twitterTitle: "Bodensee Immobilien Müller | Ihre Traumimmobilie am See",
    twitterDescription: "Professionelle Immobilienberatung am Bodensee mit über 20 Jahren Erfahrung. Jetzt Traumimmobilie finden oder verkaufen."
  },
  properties: {
    title: "Immobilien am Bodensee | Exklusive Angebote",
    description: "Entdecken Sie unsere exklusiven Immobilien in den schönsten Lagen rund um den Bodensee. Häuser, Wohnungen und Villen mit Seeblick.",
    keywords: "Immobilien Bodensee, Häuser Bodensee, Wohnungen Bodensee, Seeblick Immobilien, Konstanz Immobilien, Überlingen Immobilien",
    ogTitle: "Exklusive Immobilien am Bodensee",
    ogDescription: "Premium Immobilien mit Seeblick - Entdecken Sie Ihr Traumhaus am Bodensee",
    twitterTitle: "Exklusive Immobilien am Bodensee",
    twitterDescription: "Premium Immobilien mit Seeblick - Entdecken Sie Ihr Traumhaus am Bodensee"
  },
  "ai-valuation": {
    title: "AI-Immobilienbewertung | Kostenlose Bewertung am Bodensee",
    description: "Revolutionäre KI-Technologie für präzise Immobilienbewertungen in der Bodenseeregion. Kostenlose Sofortbewertung in wenigen Sekunden.",
    keywords: "AI Immobilienbewertung, KI Bewertung, Immobilienwert Bodensee, kostenlose Bewertung, Marktwert Immobilie",
    ogTitle: "Kostenlose AI-Immobilienbewertung",
    ogDescription: "Erhalten Sie in Sekunden eine präzise Bewertung Ihrer Immobilie mit modernster KI-Technologie",
    twitterTitle: "Kostenlose AI-Immobilienbewertung",
    twitterDescription: "Erhalten Sie in Sekunden eine präzise Bewertung Ihrer Immobilie mit modernster KI-Technologie"
  },
  contact: {
    title: "Kontakt | Bodensee Immobilien Müller",
    description: "Kontaktieren Sie Ihren Immobilienexperten am Bodensee. Persönliche Beratung für Kauf, Verkauf und Bewertung Ihrer Immobilie.",
    keywords: "Immobilien Kontakt Bodensee, Beratung Immobilien, Friedrichshafen Immobilienmakler Kontakt",
    ogTitle: "Immobilien-Beratung am Bodensee",
    ogDescription: "Persönliche und professionelle Beratung für alle Immobilienfragen am Bodensee",
    twitterTitle: "Immobilien-Beratung am Bodensee",
    twitterDescription: "Persönliche und professionelle Beratung für alle Immobilienfragen am Bodensee"
  }
};

const SEO_STRATEGIES_PRESETS = [
  {
    name: "Lokale SEO Bodensee",
    description: "Fokus auf lokale Suchbegriffe und regionale Relevanz",
    keywords: ["Bodensee", "Friedrichshafen", "Konstanz", "Überlingen", "Meersburg"]
  },
  {
    name: "Premium Immobilien",
    description: "Zielgruppe: Luxus und hochwertige Immobilien",
    keywords: ["Premium", "Luxus", "Exklusiv", "Villa", "Seeblick"]
  },
  {
    name: "Erste Käufer",
    description: "Zielgruppe: Erstkäufer und junge Familien",
    keywords: ["Erste Wohnung", "Familie", "Eigenheim", "Finanzierung", "Beratung"]
  },
  {
    name: "Investoren",
    description: "Zielgruppe: Kapitalanleger und Investoren",
    keywords: ["Kapitalanlage", "Rendite", "Investment", "Vermietung", "Portfolio"]
  }
];

export default function SEOStrategyEditor() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [editingSection, setEditingSection] = useState<string>("home");
  const [formData, setFormData] = useState<SEOStrategy["sections"]["home"]>({
    title: "",
    description: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    twitterTitle: "",
    twitterDescription: ""
  });

  // AI Keyword Analysis State
  const [aiKeywordTopic, setAiKeywordTopic] = useState("");
  const [aiKeywordLocation, setAiKeywordLocation] = useState("Bodensee");
  const [aiKeywordPropertyType, setAiKeywordPropertyType] = useState("");
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [keywordAnalysis, setKeywordAnalysis] = useState<any>(null);
  const [showAIKeywordDialog, setShowAIKeywordDialog] = useState(false);

  const queryClient = useQueryClient();

  // Load SEO strategies
  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ["/api/seo-strategies"],
    queryFn: async () => {
      const response = await fetch("/api/seo-strategies");
      if (!response.ok) throw new Error("Failed to load SEO strategies");
      return response.json();
    }
  });

  // Load active strategy
  const { data: activeStrategy } = useQuery({
    queryKey: ["/api/seo-strategies/active"],
    queryFn: async () => {
      const response = await fetch("/api/seo-strategies/active");
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Save strategy mutation
  const saveStrategyMutation = useMutation({
    mutationFn: async (strategy: Partial<SEOStrategy>) => {
      const response = await fetch("/api/seo-strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategy)
      });
      if (!response.ok) throw new Error("Failed to save strategy");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-strategies"] });
    }
  });

  // Activate strategy mutation
  const activateStrategyMutation = useMutation({
    mutationFn: async (strategyId: string) => {
      const response = await fetch(`/api/seo-strategies/${strategyId}/activate`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to activate strategy");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-strategies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seo-strategies/active"] });
    }
  });

  // Load default content for editing section
  useEffect(() => {
    if (selectedStrategy && strategies.length > 0) {
      const strategy = strategies.find((s: SEOStrategy) => s.id === selectedStrategy);
      if (strategy && strategy.sections[editingSection]) {
        setFormData(strategy.sections[editingSection]);
      } else {
        // Load defaults from existing codebase
        const defaultContent = DEFAULT_SEO_CONTENT[editingSection as keyof typeof DEFAULT_SEO_CONTENT];
        if (defaultContent) {
          setFormData(defaultContent);
        }
      }
    } else {
      // Load defaults
      const defaultContent = DEFAULT_SEO_CONTENT[editingSection as keyof typeof DEFAULT_SEO_CONTENT];
      if (defaultContent) {
        setFormData(defaultContent);
      }
    }
  }, [selectedStrategy, editingSection, strategies]);

  const handleCreateStrategy = () => {
    const newStrategy: Partial<SEOStrategy> = {
      name: "Neue SEO Strategie",
      description: "Beschreibung der Strategie",
      isActive: false,
      sections: {
        home: DEFAULT_SEO_CONTENT.home,
        properties: DEFAULT_SEO_CONTENT.properties,
        "ai-valuation": DEFAULT_SEO_CONTENT["ai-valuation"],
        contact: DEFAULT_SEO_CONTENT.contact
      }
    };

    saveStrategyMutation.mutate(newStrategy);
  };

  const handleSaveSection = () => {
    if (!selectedStrategy) return;

    const strategy = strategies.find((s: SEOStrategy) => s.id === selectedStrategy);
    if (strategy) {
      const updatedStrategy = {
        ...strategy,
        sections: {
          ...strategy.sections,
          [editingSection]: formData
        }
      };
      saveStrategyMutation.mutate(updatedStrategy);
    }
  };

  const handleActivateStrategy = (strategyId: string) => {
    activateStrategyMutation.mutate(strategyId);
  };

  const handleGenerateAIKeywords = async () => {
    if (!aiKeywordTopic.trim()) return;

    setIsGeneratingKeywords(true);
    try {
      const response = await fetch("/api/ai/seo-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiKeywordTopic,
          location: aiKeywordLocation,
          propertyType: aiKeywordPropertyType
        })
      });

      if (!response.ok) throw new Error("Failed to generate keywords");
      
      const analysis = await response.json();
      setKeywordAnalysis(analysis);
    } catch (error) {
      console.error("Error generating AI keywords:", error);
      // Show error message to user
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleApplyKeywords = (keywordType: string) => {
    if (!keywordAnalysis) return;
    
    const keywords = keywordAnalysis[keywordType] || [];
    const currentKeywords = formData.keywords ? formData.keywords.split(", ") : [];
    const newKeywords = [...currentKeywords, ...keywords];
    const uniqueKeywords = Array.from(new Set(newKeywords));
    
    setFormData({
      ...formData,
      keywords: uniqueKeywords.join(", ")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            SEO Strategien Manager
          </h2>
          <p className="text-gray-600">
            Verwalten Sie mehrere SEO-Strategien und wechseln Sie zwischen verschiedenen Zielgruppen
          </p>
        </div>
        <Button onClick={handleCreateStrategy} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neue Strategie
        </Button>
      </div>

      {activeStrategy && (
        <Alert>
          <TrendingUp className="w-4 h-4" />
          <AlertDescription>
            Aktive Strategie: <strong>{activeStrategy.name}</strong> - {activeStrategy.description}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>SEO Strategien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strategies.map((strategy: SEOStrategy) => (
              <div
                key={strategy.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedStrategy === strategy.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedStrategy(strategy.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{strategy.name}</h4>
                    <p className="text-sm text-gray-600">{strategy.description}</p>
                  </div>
                  {strategy.isActive && (
                    <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant={strategy.isActive ? "secondary" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateStrategy(strategy.id);
                    }}
                  >
                    {strategy.isActive ? "Aktiv" : "Aktivieren"}
                  </Button>
                </div>
              </div>
            ))}

            {/* Strategy Presets */}
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Quick-Presets:</h4>
              {SEO_STRATEGIES_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const newStrategy: Partial<SEOStrategy> = {
                      name: preset.name,
                      description: preset.description,
                      isActive: false,
                      sections: {
                        home: {
                          ...DEFAULT_SEO_CONTENT.home,
                          keywords: preset.keywords.join(", ") + ", " + DEFAULT_SEO_CONTENT.home.keywords
                        },
                        properties: {
                          ...DEFAULT_SEO_CONTENT.properties,
                          keywords: preset.keywords.join(", ") + ", " + DEFAULT_SEO_CONTENT.properties.keywords
                        },
                        "ai-valuation": {
                          ...DEFAULT_SEO_CONTENT["ai-valuation"],
                          keywords: preset.keywords.join(", ") + ", " + DEFAULT_SEO_CONTENT["ai-valuation"].keywords
                        },
                        contact: {
                          ...DEFAULT_SEO_CONTENT.contact,
                          keywords: preset.keywords.join(", ") + ", " + DEFAULT_SEO_CONTENT.contact.keywords
                        }
                      }
                    };
                    saveStrategyMutation.mutate(newStrategy);
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SEO Content Editor</CardTitle>
            <div className="flex gap-2">
              <Select value={editingSection} onValueChange={setEditingSection}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Startseite</SelectItem>
                  <SelectItem value="properties">Immobilien</SelectItem>
                  <SelectItem value="ai-valuation">AI-Bewertung</SelectItem>
                  <SelectItem value="contact">Kontakt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basis SEO</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="preview">Vorschau</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel (50-60 Zeichen)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="SEO-optimierter Titel"
                  />
                  <div className="text-xs text-gray-500">
                    {formData.title.length}/60 Zeichen
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Meta Description (150-160 Zeichen)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Prägnante Beschreibung für Suchergebnisse"
                    rows={3}
                  />
                  <div className="text-xs text-gray-500">
                    {formData.description.length}/160 Zeichen
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="keywords">Keywords (kommagetrennt)</Label>
                    <Dialog open={showAIKeywordDialog} onOpenChange={setShowAIKeywordDialog}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Brain className="w-4 h-4" />
                          AI Keywords
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            AI-gestützte SEO Keyword-Analyse
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Input Section */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Thema/Fokus</Label>
                              <Input
                                value={aiKeywordTopic}
                                onChange={(e) => setAiKeywordTopic(e.target.value)}
                                placeholder="z.B. Luxusimmobilien, Ferienwohnungen"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Standort</Label>
                              <Input
                                value={aiKeywordLocation}
                                onChange={(e) => setAiKeywordLocation(e.target.value)}
                                placeholder="z.B. Bodensee, Friedrichshafen"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Immobilienart</Label>
                              <Input
                                value={aiKeywordPropertyType}
                                onChange={(e) => setAiKeywordPropertyType(e.target.value)}
                                placeholder="z.B. Villa, Wohnung, Haus"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleGenerateAIKeywords}
                            disabled={!aiKeywordTopic.trim() || isGeneratingKeywords}
                            className="w-full flex items-center gap-2"
                          >
                            <Wand2 className="w-4 h-4" />
                            {isGeneratingKeywords ? "Analysiere..." : "AI-Analyse starten"}
                          </Button>

                          {/* Results Section */}
                          {keywordAnalysis && (
                            <div className="space-y-4">
                              <Separator />
                              <h4 className="font-semibold text-lg">Keyword-Analyse Ergebnisse</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries({
                                  primaryKeywords: "Haupt-Keywords",
                                  secondaryKeywords: "Sekundäre Keywords", 
                                  longTailKeywords: "Long-Tail Keywords",
                                  localKeywords: "Lokale Keywords",
                                  competitorKeywords: "Konkurrenz Keywords",
                                  seasonalKeywords: "Saisonale Keywords"
                                }).map(([key, label]) => (
                                  <Card key={key} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium">{label}</h5>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleApplyKeywords(key)}
                                        className="text-xs"
                                      >
                                        Hinzufügen
                                      </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {(keywordAnalysis[key] || []).map((keyword: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </Card>
                                ))}
                              </div>

                              {/* Recommendations */}
                              <Card className="p-4">
                                <h5 className="font-medium mb-2">AI-Empfehlungen</h5>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {(keywordAnalysis.recommendations || []).map((rec: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-blue-600">•</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </Card>

                              {/* Metrics */}
                              <div className="flex gap-4">
                                <Badge variant={keywordAnalysis.searchVolume === 'high' ? 'default' : 'secondary'}>
                                  Suchvolumen: {keywordAnalysis.searchVolume}
                                </Badge>
                                <Badge variant={keywordAnalysis.difficulty === 'easy' ? 'default' : 'secondary'}>
                                  Schwierigkeit: {keywordAnalysis.difficulty}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Textarea
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="Keyword1, Keyword2, Keyword3"
                    rows={3}
                  />
                  <div className="text-xs text-gray-500">
                    Tipp: Nutzen Sie den AI Keywords Button für intelligente Keyword-Vorschläge
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Open Graph (Facebook)</h4>
                  <div className="space-y-2">
                    <Label>OG Titel</Label>
                    <Input
                      value={formData.ogTitle || formData.title}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OG Beschreibung</Label>
                    <Textarea
                      value={formData.ogDescription || formData.description}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Twitter Card</h4>
                  <div className="space-y-2">
                    <Label>Twitter Titel</Label>
                    <Input
                      value={formData.twitterTitle || formData.title}
                      onChange={(e) => setFormData({ ...formData, twitterTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter Beschreibung</Label>
                    <Textarea
                      value={formData.twitterDescription || formData.description}
                      onChange={(e) => setFormData({ ...formData, twitterDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Google Suchergebnis Vorschau</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                      {formData.title || "Titel hier..."}
                    </div>
                    <div className="text-green-600 text-sm">
                      https://immo-muller.replit.app/{editingSection}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {formData.description || "Beschreibung hier..."}
                    </div>
                  </div>

                  <h4 className="font-semibold">Facebook/OpenGraph Vorschau</h4>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="h-32 bg-blue-100 flex items-center justify-center">
                      <span className="text-gray-500">Bild Platzhalter</span>
                    </div>
                    <div className="p-3">
                      <div className="font-semibold">
                        {formData.ogTitle || formData.title || "Titel hier..."}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {formData.ogDescription || formData.description || "Beschreibung hier..."}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveSection}
                disabled={!selectedStrategy || saveStrategyMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveStrategyMutation.isPending ? "Speichere..." : "Speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
