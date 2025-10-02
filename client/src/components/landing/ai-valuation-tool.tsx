import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  TrendingUp,
  MapPin,
  Home,
  Calendar,
  Bed,
  Bath,
  Square,
  CheckCircle,
  AlertCircle,
  Info,
  Euro,
  Target,
  BarChart3,
  Send,
  User,
  Mail,
  Phone,
  Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ALL_CITIES, PROPERTY_TYPES, PROPERTY_CONDITIONS } from "@shared/constants";

interface PropertyData {
  propertyType: string;
  size: string;
  location: string;
  condition: string;
  yearBuilt: string;
  bedrooms: string;
  bathrooms: string;
  features: string;
  nearbyAmenities: string;
  // Neue wichtige Felder
  energyClass: string;
  heatingType: string;
  plotSize: string;
  garageSpaces: string;
  basement: string;
  balconyTerrace: string;
  renovation: string;
  lakeDistance: string;
  publicTransport: string;
  internetSpeed: string;
  noiseLevel: string;
  viewQuality: string;
  // Neue Ausstattungsfelder
  flooring: string;
  kitchen: string;
  bathroom: string;
  security: string;
  smartHome: string;
  elevator: string;
  wellness: string;
  fireplace: string;
  airConditioning: string;
  solarSystem: string;
  electricCar: string;
  storageSpace: string;
}

interface ValuationResult {
  estimatedValue: number;
  confidenceScore: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    location: { score: number; impact: string };
    condition: { score: number; impact: string };
    size: { score: number; impact: string };
    market: { score: number; impact: string };
  };
  reasoning: string;
  recommendations?: string[];
  marketTrends: string;
}

export default function AIValuationTool() {
  const [formData, setFormData] = useState<PropertyData>({
    propertyType: "",
    size: "",
    location: "",
    condition: "",
    yearBuilt: "",
    bedrooms: "",
    bathrooms: "",
    features: "",
    nearbyAmenities: "",
    // Neue Felder
    energyClass: "",
    heatingType: "",
    plotSize: "",
    garageSpaces: "",
    basement: "",
    balconyTerrace: "",
    renovation: "",
    lakeDistance: "",
    publicTransport: "",
    internetSpeed: "",
    noiseLevel: "",
    viewQuality: "",
    // Neue Ausstattungsfelder
    flooring: "",
    kitchen: "",
    bathroom: "",
    security: "",
    smartHome: "",
    elevator: "",
    wellness: "",
    fireplace: "",
    airConditioning: "",
    solarSystem: "",
    electricCar: "",
    storageSpace: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleInputChange = (field: keyof PropertyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactInputChange = (
    field: keyof typeof contactInfo,
    value: string,
  ) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    console.log("🎯 Starting AI valuation analysis...", formData);

    // Validate required fields
    const requiredFields = ["propertyType", "size", "location", "condition"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof PropertyData],
    );

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    const requestData = {
      propertyType: formData.propertyType,
      size: parseInt(formData.size) || 0,
      location: formData.location,
      condition: formData.condition,
      yearBuilt: parseInt(formData.yearBuilt) || undefined,
      bedrooms: parseInt(formData.bedrooms) || undefined,
      bathrooms: parseInt(formData.bathrooms) || undefined,
      features: formData.features
        ? formData.features.split(",").map((f) => f.trim())
        : [],
      nearbyAmenities: formData.nearbyAmenities
        ? formData.nearbyAmenities.split(",").map((a) => a.trim())
        : [],
    };

    console.log("📤 Sending valuation request:", requestData);

    try {
      const response = await fetch("/api/ai/valuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Fehler bei der AI-Analyse");
      }

      const data = await response.json();
      console.log("✅ Valuation result received:", data);
      setResult(data);

      toast({
        title: "Bewertung abgeschlossen!",
        description: `Geschätzter Wert: ${formatPrice(data.estimatedValue)}`,
      });
    } catch (error) {
      console.error("❌ Valuation error:", error);
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Die AI-Bewertung konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    // Basic validation for contact form
    if (!contactInfo.name || !contactInfo.email || !contactInfo.message) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie Name, E-Mail und Ihre Nachricht aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contactInfo,
          propertyDetails: result
            ? {
                // Attach property details if available
                estimatedValue: result.estimatedValue,
                location: formData.location,
                propertyType: formData.propertyType,
                size: formData.size,
                condition: formData.condition,
              }
            : undefined,
          message: result
            ? `AI-Bewertungsanfrage:\n\nGeschätzter Wert: ${formatPrice(result.estimatedValue)}\nImmobilie: ${formData.propertyType} in ${formData.location}\nGröße: ${formData.size} m²\nZustand: ${formData.condition}\n\nMeine Nachricht:\n${contactInfo.message}`
            : contactInfo.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Nachricht konnte nicht gesendet werden");
      }

      toast({
        title: "Nachricht gesendet!",
        description: "Wir werden uns bald bei Ihnen melden.",
      });
      setContactInfo({ name: "", email: "", phone: "", message: "" }); // Clear form
      setDialogOpen(false); // Close dialog
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Fehler",
        description:
          "Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return "Hoch";
    if (score >= 60) return "Mittel";
    return "Niedrig";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-gradient-to-r from-[#566873] to-[#65858C] p-3 rounded-2xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Kostenlose AI-Bewertung
          </h2>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Erhalten Sie eine präzise, KI-gestützte Bewertung Ihrer Immobilie mit
          detaillierter Analyse und Vertrauensindikator
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Immobiliendaten eingeben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Property Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Immobilienart *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    handleInputChange("propertyType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie den Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einfamilienhaus">
                      Einfamilienhaus
                    </SelectItem>
                    <SelectItem value="doppelhaus">Doppelhaus</SelectItem>
                    <SelectItem value="reihenhaus">Reihenhaus</SelectItem>
                    <SelectItem value="wohnung">Wohnung</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="grundstueck">Grundstück</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size" className="flex items-center gap-1">
                  <Square className="w-4 h-4" />
                  Wohnfläche (m²) *
                </Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="z.B. 120"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Lage *
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie die Lage" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CITIES.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Zustand *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    handleInputChange("condition", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie den Zustand" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Details */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearBuilt" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Baujahr
                </Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="z.B. 1995"
                  value={formData.yearBuilt}
                  onChange={(e) =>
                    handleInputChange("yearBuilt", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  Schlafzimmer
                </Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="z.B. 3"
                  value={formData.bedrooms}
                  onChange={(e) =>
                    handleInputChange("bedrooms", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  Badezimmer
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="z.B. 2"
                  value={formData.bathrooms}
                  onChange={(e) =>
                    handleInputChange("bathrooms", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Energieeffizienz & Heizung */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Energieeffizienz & Technik</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energyClass">Energieeffizienzklasse</Label>
                <Select
                  value={formData.energyClass}
                  onValueChange={(value) => handleInputChange("energyClass", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Energieklasse wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a+">A+ (sehr effizient)</SelectItem>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                    <SelectItem value="e">E</SelectItem>
                    <SelectItem value="f">F</SelectItem>
                    <SelectItem value="g">G (wenig effizient)</SelectItem>
                    <SelectItem value="unbekannt">Unbekannt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heatingType">Heizungsart</Label>
                <Select
                  value={formData.heatingType}
                  onValueChange={(value) => handleInputChange("heatingType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Heizungsart wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waermepumpe">Wärmepumpe</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="oel">Öl</SelectItem>
                    <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                    <SelectItem value="pellets">Pellets</SelectItem>
                    <SelectItem value="solar">Solar</SelectItem>
                    <SelectItem value="elektro">Elektro</SelectItem>
                    <SelectItem value="andere">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grundstück & Außenanlagen */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Grundstück & Außenanlagen</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plotSize">Grundstücksgröße (m²)</Label>
                <Input
                  id="plotSize"
                  type="number"
                  placeholder="z.B. 500"
                  value={formData.plotSize}
                  onChange={(e) => handleInputChange("plotSize", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garageSpaces">Garage/Stellplätze</Label>
                <Select
                  value={formData.garageSpaces}
                  onValueChange={(value) => handleInputChange("garageSpaces", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Anzahl wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Keine</SelectItem>
                    <SelectItem value="1">1 Platz</SelectItem>
                    <SelectItem value="2">2 Plätze</SelectItem>
                    <SelectItem value="3">3+ Plätze</SelectItem>
                    <SelectItem value="carport">Carport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basement">Keller</Label>
                <Select
                  value={formData.basement}
                  onValueChange={(value) => handleInputChange("basement", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keller vorhanden?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voll">Vollkeller</SelectItem>
                    <SelectItem value="teilweise">Teilkeller</SelectItem>
                    <SelectItem value="keiner">Kein Keller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balconyTerrace">Balkon/Terrasse</Label>
                <Select
                  value={formData.balconyTerrace}
                  onValueChange={(value) => handleInputChange("balconyTerrace", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balkon">Balkon</SelectItem>
                    <SelectItem value="terrasse">Terrasse</SelectItem>
                    <SelectItem value="beides">Balkon + Terrasse</SelectItem>
                    <SelectItem value="garten">Eigener Garten</SelectItem>
                    <SelectItem value="keines">Keines</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renovation">Letzte Renovierung</Label>
                <Select
                  value={formData.renovation}
                  onValueChange={(value) => handleInputChange("renovation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zeitraum wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020-2024">2020-2024</SelectItem>
                    <SelectItem value="2015-2019">2015-2019</SelectItem>
                    <SelectItem value="2010-2014">2010-2014</SelectItem>
                    <SelectItem value="2000-2009">2000-2009</SelectItem>
                    <SelectItem value="vor-2000">Vor 2000</SelectItem>
                    <SelectItem value="nie">Nie renoviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lage & Umgebung (Bodensee-spezifisch) */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Lage & Umgebung (Bodensee-Region)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lakeDistance">Entfernung zum Bodensee</Label>
                <Select
                  value={formData.lakeDistance}
                  onValueChange={(value) => handleInputChange("lakeDistance", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Entfernung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-100m">0-100m (Seelage)</SelectItem>
                    <SelectItem value="100-300m">100-300m</SelectItem>
                    <SelectItem value="300-500m">300-500m</SelectItem>
                    <SelectItem value="500m-1km">500m-1km</SelectItem>
                    <SelectItem value="1-3km">1-3km</SelectItem>
                    <SelectItem value="3km+">Über 3km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewQuality">Aussicht</Label>
                <Select
                  value={formData.viewQuality}
                  onValueChange={(value) => handleInputChange("viewQuality", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aussicht bewerten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeblick-direkt">Direkter Seeblick</SelectItem>
                    <SelectItem value="seeblick-seitlich">Seitlicher Seeblick</SelectItem>
                    <SelectItem value="seeblick-fern">Fernsicht zum See</SelectItem>
                    <SelectItem value="bergblick">Bergblick</SelectItem>
                    <SelectItem value="gruenblick">Grünblick</SelectItem>
                    <SelectItem value="stadtblick">Stadtblick</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publicTransport">ÖPNV-Anbindung</Label>
                <Select
                  value={formData.publicTransport}
                  onValueChange={(value) => handleInputChange("publicTransport", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bewerten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sehr-gut">Sehr gut (0-300m)</SelectItem>
                    <SelectItem value="gut">Gut (300-500m)</SelectItem>
                    <SelectItem value="befriedigend">Befriedigend (500m-1km)</SelectItem>
                    <SelectItem value="schlecht">Schlecht (über 1km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="internetSpeed">Internet-Geschwindigkeit</Label>
                <Select
                  value={formData.internetSpeed}
                  onValueChange={(value) => handleInputChange("internetSpeed", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Geschwindigkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glasfaser">Glasfaser (1000+ Mbit/s)</SelectItem>
                    <SelectItem value="schnell">Schnell (100-1000 Mbit/s)</SelectItem>
                    <SelectItem value="standard">Standard (50-100 Mbit/s)</SelectItem>
                    <SelectItem value="langsam">Langsam (unter 50 Mbit/s)</SelectItem>
                    <SelectItem value="unbekannt">Unbekannt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noiseLevel">Lärmbelastung</Label>
                <Select
                  value={formData.noiseLevel}
                  onValueChange={(value) => handleInputChange("noiseLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lärmpegel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sehr-ruhig">Sehr ruhig</SelectItem>
                    <SelectItem value="ruhig">Ruhig</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="laut">Etwas laut</SelectItem>
                    <SelectItem value="sehr-laut">Sehr laut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Innenausstattung */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Innenausstattung</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flooring">Bodenbeläge</Label>
                <Select
                  value={formData.flooring}
                  onValueChange={(value) => handleInputChange("flooring", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hauptbodenbelag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parkett">Parkett</SelectItem>
                    <SelectItem value="laminat">Laminat</SelectItem>
                    <SelectItem value="fliesen">Fliesen</SelectItem>
                    <SelectItem value="naturstein">Naturstein</SelectItem>
                    <SelectItem value="vinylboden">Vinylboden</SelectItem>
                    <SelectItem value="teppich">Teppich</SelectItem>
                    <SelectItem value="mix">Verschiedene</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kitchen">Küche</Label>
                <Select
                  value={formData.kitchen}
                  onValueChange={(value) => handleInputChange("kitchen", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Küchenausstattung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einbaukueche-hochwertig">Einbauküche (hochwertig)</SelectItem>
                    <SelectItem value="einbaukueche-standard">Einbauküche (standard)</SelectItem>
                    <SelectItem value="kochnische">Kochnische</SelectItem>
                    <SelectItem value="keine">Keine Küche</SelectItem>
                    <SelectItem value="geplant">Küche geplant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathroom">Badezimmer-Standard</Label>
                <Select
                  value={formData.bathroom}
                  onValueChange={(value) => handleInputChange("bathroom", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bad-Ausstattung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="luxus">Luxus (Marmor, Designer)</SelectItem>
                    <SelectItem value="hochwertig">Hochwertig</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="einfach">Einfach</SelectItem>
                    <SelectItem value="sanierungsbeduerftig">Sanierungsbedürftig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sicherheit & Smart Home */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Sicherheit & Smart Home</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="security">Sicherheitsausstattung</Label>
                <Select
                  value={formData.security}
                  onValueChange={(value) => handleInputChange("security", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sicherheit wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alarmanlage">Alarmanlage</SelectItem>
                    <SelectItem value="videoueberwachung">Videoüberwachung</SelectItem>
                    <SelectItem value="sicherheitstuer">Sicherheitstür</SelectItem>
                    <SelectItem value="komplett">Komplettsystem</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="keine">Keine besonderen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smartHome">Smart Home</Label>
                <Select
                  value={formData.smartHome}
                  onValueChange={(value) => handleInputChange("smartHome", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Smart Home Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vollautomatisiert">Vollautomatisiert</SelectItem>
                    <SelectItem value="teilautomatisiert">Teilautomatisiert</SelectItem>
                    <SelectItem value="grundausstattung">Grundausstattung</SelectItem>
                    <SelectItem value="vorbereitet">Vorbereitet</SelectItem>
                    <SelectItem value="keine">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevator">Aufzug</Label>
                <Select
                  value={formData.elevator}
                  onValueChange={(value) => handleInputChange("elevator", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aufzug vorhanden?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personenaufzug">Personenaufzug</SelectItem>
                    <SelectItem value="lastenaufzug">Lastenaufzug</SelectItem>
                    <SelectItem value="beide">Beides</SelectItem>
                    <SelectItem value="keiner">Kein Aufzug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Wellness & Komfort */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Wellness & Komfort</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wellness">Wellness-Bereich</Label>
                <Select
                  value={formData.wellness}
                  onValueChange={(value) => handleInputChange("wellness", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wellness-Ausstattung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spa-komplett">Spa-Bereich (Sauna + Pool)</SelectItem>
                    <SelectItem value="sauna">Sauna</SelectItem>
                    <SelectItem value="whirlpool">Whirlpool</SelectItem>
                    <SelectItem value="pool-indoor">Indoor-Pool</SelectItem>
                    <SelectItem value="pool-outdoor">Outdoor-Pool</SelectItem>
                    <SelectItem value="dampfbad">Dampfbad</SelectItem>
                    <SelectItem value="keine">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fireplace">Kamin/Ofen</Label>
                <Select
                  value={formData.fireplace}
                  onValueChange={(value) => handleInputChange("fireplace", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Feuerstelle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kachelofen">Kachelofen</SelectItem>
                    <SelectItem value="kamin-offen">Offener Kamin</SelectItem>
                    <SelectItem value="pelletofen">Pelletofen</SelectItem>
                    <SelectItem value="gaskamin">Gaskamin</SelectItem>
                    <SelectItem value="elektro-kamin">Elektro-Kamin</SelectItem>
                    <SelectItem value="mehrere">Mehrere</SelectItem>
                    <SelectItem value="keiner">Kein Kamin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="airConditioning">Klimatisierung</Label>
                <Select
                  value={formData.airConditioning}
                  onValueChange={(value) => handleInputChange("airConditioning", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Klimaanlage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zentral">Zentrale Klimaanlage</SelectItem>
                    <SelectItem value="split">Split-Klimageräte</SelectItem>
                    <SelectItem value="lueftungsanlage">Lüftungsanlage</SelectItem>
                    <SelectItem value="teilweise">Teilweise klimatisiert</SelectItem>
                    <SelectItem value="keine">Keine Klimatisierung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Energietechnik */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Zusätzliche Energietechnik</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="solarSystem">Solaranlage</Label>
                <Select
                  value={formData.solarSystem}
                  onValueChange={(value) => handleInputChange("solarSystem", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Solar-System" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photovoltaik">Photovoltaikanlage</SelectItem>
                    <SelectItem value="solarthermie">Solarthermie</SelectItem>
                    <SelectItem value="beide">Beide Systeme</SelectItem>
                    <SelectItem value="geplant">Geplant</SelectItem>
                    <SelectItem value="keine">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="electricCar">E-Auto Ladestation</Label>
                <Select
                  value={formData.electricCar}
                  onValueChange={(value) => handleInputChange("electricCar", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lademöglichkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallbox">Wallbox installiert</SelectItem>
                    <SelectItem value="starkstrom">Starkstrom vorhanden</SelectItem>
                    <SelectItem value="vorbereitet">Vorbereitet</SelectItem>
                    <SelectItem value="geplant">Geplant</SelectItem>
                    <SelectItem value="keine">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageSpace">Zusätzlicher Stauraum</Label>
                <Select
                  value={formData.storageSpace}
                  onValueChange={(value) => handleInputChange("storageSpace", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stauraum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dachboden-ausgebaut">Dachboden (ausgebaut)</SelectItem>
                    <SelectItem value="dachboden-rohbau">Dachboden (Rohbau)</SelectItem>
                    <SelectItem value="abstellraum">Abstellräume</SelectItem>
                    <SelectItem value="gartenhaus">Gartenhaus</SelectItem>
                    <SelectItem value="werkstatt">Werkstatt</SelectItem>
                    <SelectItem value="wenig">Wenig Stauraum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <Separator />
            <h4 className="font-semibold text-gray-900">Weitere Besonderheiten</h4>
            <div className="space-y-2">
              <Label htmlFor="features">Sonstige Besonderheiten</Label>
              <Textarea
                id="features"
                placeholder="z.B. Wintergarten, Dachterrasse, Einliegerwohnung, Hobbyraum, Weinkeller, Bibliothek, Büro, Ankleidezimmer (durch Komma getrennt)"
                value={formData.features}
                onChange={(e) => handleInputChange("features", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nearbyAmenities">
                Nahegelegene Annehmlichkeiten
              </Label>
              <Textarea
                id="nearbyAmenities"
                placeholder="z.B. Seezugang, Bahnhof, Schulen, Einkaufszentrum, Restaurants, Ärzte, Apotheken (durch Komma getrennt)"
                value={formData.nearbyAmenities}
                onChange={(e) =>
                  handleInputChange("nearbyAmenities", e.target.value)
                }
                rows={2}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="cta"
              size="lg"
              className="w-full h-12 text-lg"
              data-testid="button-ai-analyze"
            >
              {isAnalyzing ? (
                <>
                  <Bot className="w-5 h-5 mr-2" />
                  AI analysiert...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  AI-Bewertung starten
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Bewertungsergebnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !isAnalyzing && (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Füllen Sie das Formular aus und starten Sie die AI-Analyse
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-[var(--arctic-blue)] mx-auto mb-4 animate-pulse" />
                <p className="text-lg font-medium mb-2">
                  AI analysiert Ihre Immobilie...
                </p>
                <p className="text-gray-500 text-sm">
                  Marktdaten werden ausgewertet und Bewertung erstellt
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Main Valuation */}
                <div className="text-center bg-gradient-to-br from-[var(--arctic-blue)]/10 to-[var(--ruskin-blue)]/10 p-6 rounded-xl border border-[var(--arctic-blue)]/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Euro className="w-6 h-6 text-[var(--arctic-blue)]" />
                    <span className="text-lg font-medium text-gray-700">
                      Geschätzter Wert
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPrice(result.estimatedValue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Spanne: {formatPrice(result.priceRange.min)} -{" "}
                    {formatPrice(result.priceRange.max)}
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Vertrauensindikator</span>
                    </div>
                    <Badge
                      variant={
                        result.confidenceScore >= 80
                          ? "default"
                          : result.confidenceScore >= 60
                            ? "secondary"
                            : "destructive"
                      }
                      className={getConfidenceColor(result.confidenceScore)}
                    >
                      {getConfidenceLabel(result.confidenceScore)} (
                      {result.confidenceScore}%)
                    </Badge>
                  </div>
                  <Progress value={result.confidenceScore} className="h-3" />
                  <p className="text-sm text-gray-600">
                    {result.confidenceScore >= 80 &&
                      "Sehr zuverlässige Bewertung basierend auf umfassenden Daten"}
                    {result.confidenceScore >= 60 &&
                      result.confidenceScore < 80 &&
                      "Gute Bewertung, könnte von zusätzlichen Daten profitieren"}
                    {result.confidenceScore < 60 &&
                      "Vorläufige Bewertung, mehr Details würden die Genauigkeit erhöhen"}
                  </p>
                </div>

                {/* Factors Analysis */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Bewertungsfaktoren
                  </h4>

                  {Object.entries(result.factors).map(([key, factor]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {key === "location" && "Lage"}
                          {key === "condition" && "Zustand"}
                          {key === "size" && "Größe"}
                          {key === "market" && "Markt"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {factor.score}%
                        </span>
                      </div>
                      <Progress value={factor.score} className="h-2" />
                      <p className="text-xs text-gray-600">{factor.impact}</p>
                    </div>
                  ))}
                </div>

                {/* Reasoning */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Bewertungsgrundlage
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>

                {/* Market Trends */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Markttrends
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {result.marketTrends}
                  </p>
                </div>

                {/* Recommendations */}
                {result.recommendations &&
                  result.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Empfehlungen
                      </h4>
                      <ul className="space-y-1">
                        {result.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Contact Button */}
                <div className="text-center pt-4">
                  <Button
                    onClick={() => setDialogOpen(true)}
                    variant="cta"
                    size="lg"
                    className="w-full h-12 text-lg"
                    data-testid="button-contact"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Kontakt aufnehmen
                  </Button>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Wichtiger Hinweis</p>
                      <p>
                        Diese AI-Bewertung dient als erste Orientierung. Für
                        eine verbindliche Bewertung empfehlen wir eine
                        professionelle Begutachtung vor Ort.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Follow-up Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center space-x-2 bg-blue-100 rounded-full px-4 py-2 mb-4 w-fit mx-auto">
              <Bot className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI-Bewertung besprechen</span>
            </div>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Send className="w-5 h-5 text-[hsl(210,70%,50%)]" />
              AI-Bewertung besprechen
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Haben Sie Fragen zu Ihrer AI-Bewertung oder möchten Sie eine persönliche Beratung vereinbaren?
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* AI Valuation Summary if available */}
            {result && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Ihre AI-Bewertung</span>
                </h4>
                <div className="text-sm text-blue-800">
                  <p><span className="font-medium">Geschätzter Wert:</span> {formatPrice(result.estimatedValue)}</p>
                  <p><span className="font-medium">Immobilie:</span> {formData.propertyType} in {formData.location}</p>
                  <p><span className="font-medium">Größe:</span> {formData.size} m²</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="contact-name"
                  className="flex items-center gap-1"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  Ihr Name
                </Label>
                <Input
                  id="contact-name"
                  placeholder="Max Mustermann"
                  value={contactInfo.name}
                  onChange={(e) =>
                    handleContactInputChange("name", e.target.value)
                  }
                  data-testid="input-ai-contact-name"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="contact-email"
                  className="flex items-center gap-1"
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  Ihre E-Mail
                </Label>
                <Input
                  id="contact-email"
                  placeholder="max.mustermann@example.com"
                  value={contactInfo.email}
                  onChange={(e) =>
                    handleContactInputChange("email", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="contact-phone"
                className="flex items-center gap-1"
              >
                <Phone className="w-4 h-4 text-gray-600" />
                Ihre Telefonnummer (optional)
              </Label>
              <Input
                id="contact-phone"
                placeholder="+49 123 4567890"
                value={contactInfo.phone}
                onChange={(e) =>
                  handleContactInputChange("phone", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Ihre Nachricht</Label>
              <Textarea
                id="contact-message"
                placeholder="Ich interessiere mich für eine professionelle Immobilienbewertung. Bitte kontaktieren Sie mich für weitere Details..."
                rows={5}
                value={contactInfo.message}
                onChange={(e) =>
                  handleContactInputChange("message", e.target.value)
                }
              />
            </div>
          </div>
          <DialogHeader className="flex items-center justify-center">
            <Button
              onClick={handleSendMessage}
              className="w-full h-12 text-lg bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90 text-white"
            >
              Nachricht senden
            </Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}