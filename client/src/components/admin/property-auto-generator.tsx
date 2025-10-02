
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Home, MapPin, Euro, Settings, Image } from "lucide-react";

interface PropertyTemplate {
  id: string;
  name: string;
  type: string;
  priceRange: [number, number];
  defaultLocation: string;
  features: string[];
  description: string;
}

const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    id: "villa",
    name: "Luxusvilla",
    type: "villa",
    priceRange: [800000, 1500000],
    defaultLocation: "Konstanz",
    features: ["Seeblick", "Pool", "Garten", "Garage", "Premium-Ausstattung"],
    description: "Exklusive Villa in bester Lage mit direktem Bodensee-Zugang und höchstem Wohnkomfort"
  },
  {
    id: "penthouse",
    name: "Penthouse",
    type: "penthouse",
    priceRange: [600000, 1200000],
    defaultLocation: "Überlingen",
    features: ["Dachterrasse", "Aufzug", "Panoramablick", "Tiefgarage"],
    description: "Exklusives Penthouse mit atemberaubendem Seeblick und großzügiger Dachterrasse"
  },
  {
    id: "einfamilienhaus",
    name: "Einfamilienhaus",
    type: "Einfamilienhaus",
    priceRange: [500000, 900000],
    defaultLocation: "Friedrichshafen",
    features: ["Garten", "Keller", "Garage", "Moderne Ausstattung"],
    description: "Gepflegtes Einfamilienhaus in ruhiger Wohnlage mit großem Garten"
  },
  {
    id: "wohnung",
    name: "Premium-Wohnung",
    type: "Wohnung",
    priceRange: [350000, 700000],
    defaultLocation: "Meersburg",
    features: ["Balkon", "Aufzug", "Einbauküche", "Seeblick"],
    description: "Moderne Wohnung mit hochwertiger Ausstattung und herrlichem Blick"
  }
];

const BODENSEE_LOCATIONS = [
  "Konstanz", "Friedrichshafen", "Überlingen", "Meersburg", 
  "Radolfzell", "Lindau", "Bregenz", "Rorschach", "Arbon"
];

export default function PropertyAutoGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<PropertyTemplate | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [customSettings, setCustomSettings] = useState({
    basePrice: 750000,
    location: "Bodensee Region",
    roomCount: 4,
    bathrooms: 2,
    size: 150
  });

  const { data: galleryImages } = useQuery({
    queryKey: ["/api/gallery"],
    select: (data) => {
      return Array.isArray(data)
        ? data.filter(img => img && img.id && img.category !== "360")
        : [];
    },
  });

  const createPropertiesMutation = useMutation({
    mutationFn: async (properties: any[]) => {
      const results = await Promise.allSettled(
        properties.map(property =>
          fetch("/api/properties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(property),
          }).then(res => res.json())
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;
      
      return { successful, failed, total: results.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setSelectedImages([]);
      toast({
        title: "Immobilien erstellt!",
        description: `${result.successful} Immobilien erfolgreich erstellt${result.failed > 0 ? `, ${result.failed} fehlgeschlagen` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Immobilien konnten nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const generateProperties = () => {
    if (selectedImages.length === 0) {
      toast({
        title: "Keine Bilder ausgewählt",
        description: "Wählen Sie mindestens ein Bild aus",
        variant: "destructive",
      });
      return;
    }

    const template = selectedTemplate || PROPERTY_TEMPLATES[0];
    const properties = selectedImages.map((imageId, index) => {
      const image = galleryImages?.find(img => img.id === imageId);
      const randomPrice = Math.floor(
        Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]
      );
      
      // Generate varied property details
      const roomVariations = [3, 4, 5, 6];
      const sizeVariations = [100, 120, 150, 180, 200, 250];
      const bathroomVariations = [1, 2, 3];
      
      return {
        title: `${template.name} ${image?.originalName?.replace(/\.[^/.]+$/, "") || `#${index + 1}`}`,
        description: `${template.description} - ${image?.originalName || "Premium-Objekt"}`,
        type: template.type,
        location: customSettings.location || template.defaultLocation,
        price: customSettings.basePrice || randomPrice,
        size: customSettings.size || sizeVariations[Math.floor(Math.random() * sizeVariations.length)],
        rooms: customSettings.roomCount || roomVariations[Math.floor(Math.random() * roomVariations.length)],
        bathrooms: customSettings.bathrooms || bathroomVariations[Math.floor(Math.random() * bathroomVariations.length)],
        yearBuilt: new Date().getFullYear() - Math.floor(Math.random() * 20),
        status: "available",
        features: template.features,
        images: [imageId],
      };
    });

    createPropertiesMutation.mutate(properties);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <span>Automatische Immobilien-Erstellung</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Auswahl */}
          <div>
            <Label className="text-base font-medium">Immobilien-Vorlage</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {PROPERTY_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate?.id === template.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.type}</div>
                  <div className="text-xs text-blue-600">
                    {Math.floor(template.priceRange[0] / 1000)}k - {Math.floor(template.priceRange[1] / 1000)}k €
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Individuelle Einstellungen */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="basePrice">Basispreis (€)</Label>
              <Input
                id="basePrice"
                type="number"
                value={customSettings.basePrice}
                onChange={(e) => setCustomSettings(prev => ({ 
                  ...prev, 
                  basePrice: parseInt(e.target.value) || 0 
                }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Standort</Label>
              <Select 
                value={customSettings.location} 
                onValueChange={(value) => setCustomSettings(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODENSEE_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rooms">Zimmer</Label>
              <Input
                id="rooms"
                type="number"
                value={customSettings.roomCount}
                onChange={(e) => setCustomSettings(prev => ({ 
                  ...prev, 
                  roomCount: parseInt(e.target.value) || 1 
                }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Bäder</Label>
              <Input
                id="bathrooms"
                type="number"
                value={customSettings.bathrooms}
                onChange={(e) => setCustomSettings(prev => ({ 
                  ...prev, 
                  bathrooms: parseInt(e.target.value) || 1 
                }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="size">Größe (m²)</Label>
              <Input
                id="size"
                type="number"
                value={customSettings.size}
                onChange={(e) => setCustomSettings(prev => ({ 
                  ...prev, 
                  size: parseInt(e.target.value) || 50 
                }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Bildauswahl */}
          <div>
            <Label className="text-base font-medium">
              Bilder auswählen ({selectedImages.length} ausgewählt)
            </Label>
            <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {galleryImages && galleryImages.length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {galleryImages.map((image: any) => (
                    <button
                      key={image.id}
                      onClick={() => toggleImageSelection(image.id)}
                      className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImages.includes(image.id)
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <img
                        src={`/api/gallery/${image.id}/image`}
                        alt={image.originalName || image.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedImages.includes(image.id) && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-purple-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                            ✓
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-8 h-8 mx-auto mb-2" />
                  <p>Keine Bilder in der Galerie</p>
                </div>
              )}
            </div>
          </div>

          {/* Aktions-Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button
              onClick={generateProperties}
              disabled={selectedImages.length === 0 || createPropertiesMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {createPropertiesMutation.isPending 
                ? "Erstelle Immobilien..." 
                : `${selectedImages.length} Immobilien erstellen`
              }
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setSelectedImages([])}
              disabled={selectedImages.length === 0}
            >
              Auswahl zurücksetzen
            </Button>
            
            <div className="text-sm text-gray-600">
              Pro Bild wird eine Immobilie mit {selectedTemplate?.name || "Standard-Vorlage"} erstellt
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
