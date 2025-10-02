import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building,
  MapPin,
  Bed,
  Bath,
  Square,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import PropertyImageSelector from "./property-image-selector";
import { useForm } from "react-hook-form";
import { 
  PROPERTY_TYPES, 
  BODENSEE_CITIES, 
  PROPERTY_CONDITIONS, 
  PROPERTY_FEATURES 
} from "@shared/constants";

// Constants are now imported from shared/constants.ts

export default function PropertiesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    status: "",
    search: "",
    page: 1,
  });
  const [isNewPropertyModalOpen, setIsNewPropertyModalOpen] = useState(false);
  const [editPropertyModalOpen, setEditPropertyModalOpen] = useState(false);
  const [viewPropertyModalOpen, setViewPropertyModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [newProperty, setNewProperty] = useState({
    title: "",
    description: "",
    type: "",
    location: "",
    price: "",
    size: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    yearBuilt: "",
    features: "",
    status: "available",
    images: [] as string[],
    // Neue AI-Bewertungsfelder
    condition: "",
    nearbyAmenities: "",
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

  // Define form interface for better type safety
  interface PropertyFormData {
    title: string;
    description: string;
    type: string;
    location: string;
    price: string;
    size: string;
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    yearBuilt: string;
    features: string;
    status: string;
    images: string[];
    energyClass: string;
    agentNotes: string;
    condition: string;
    nearbyAmenities: string;
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
    marketAnalysis: {
      pricePerSqm: number;
      marketTrend: string;
      comparableProperties: string;
      investmentPotential: string;
    };
  }

  const { register, handleSubmit, setValue, watch } = useForm<PropertyFormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "",
      location: "",
      price: "",
      size: "",
      rooms: "",
      bedrooms: "",
      bathrooms: "",
      yearBuilt: "", // Changed to string for consistency
      features: "",
      status: "available",
      images: [],
      energyClass: "",
      agentNotes: "",
      // Neue AI-Bewertungsfelder
      condition: "",
      nearbyAmenities: "",
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
      marketAnalysis: {
        pricePerSqm: 0,
        marketTrend: "",
        comparableProperties: "",
        investmentPotential: "",
      },
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/properties",
      {
        type: filters.type,
        location: filters.location,
        status: filters.status,
        search: filters.search,
        page: filters.page.toString(),
        limit: "10",
      },
    ],
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      return await apiRequest("/api/properties", {
        method: "POST",
        body: propertyData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsNewPropertyModalOpen(false);
      setNewProperty({
        title: "",
        description: "",
        type: "",
        location: "",
        price: "",
        size: "",
        rooms: "",
        bedrooms: "",
        bathrooms: "",
        yearBuilt: "",
        features: "",
        status: "available",
        images: [],
        condition: "",
        nearbyAmenities: "",
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
      toast({
        title: "Immobilie erstellt",
        description: "Die neue Immobilie wurde erfolgreich erstellt",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Immobilie konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/properties/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Immobilie gelöscht",
        description: "Die Immobilie wurde erfolgreich gelöscht",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Immobilie konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({
      ...prev,
      [key]: filterValue,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleNewPropertyChange = (key: string, value: string) => {
    setNewProperty((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateProperty = (dataFromForm: PropertyFormData) => {
    // Validate required fields
    if (!dataFromForm.title || !dataFromForm.type || !dataFromForm.location) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for submission
    const propertyData = {
      title: dataFromForm.title,
      description: dataFromForm.description,
      type: dataFromForm.type,
      location: dataFromForm.location,
      address: dataFromForm.location, // Use location as address
      price: dataFromForm.price ? parseFloat(dataFromForm.price) : undefined,
      size: dataFromForm.size ? parseInt(dataFromForm.size, 10) : undefined,
      rooms: dataFromForm.rooms ? parseInt(dataFromForm.rooms, 10) : undefined,
      bedrooms: dataFromForm.bedrooms ? parseInt(dataFromForm.bedrooms, 10) : undefined,
      bathrooms: dataFromForm.bathrooms
        ? parseInt(dataFromForm.bathrooms, 10)
        : undefined,
      yearBuilt: dataFromForm.yearBuilt ? parseInt(dataFromForm.yearBuilt, 10) : undefined,
      status: dataFromForm.status,
      features: dataFromForm.features
        ? dataFromForm.features
            .split(",")
            .map((f: string) => f.trim())
            .filter((f: string) => f)
        : [],
      images: newProperty.images || [], // Use images from component state
      energyClass: dataFromForm.energyClass,
      agentNotes: dataFromForm.agentNotes,
      // Neue AI-Bewertungsfelder
      condition: dataFromForm.condition,
      nearbyAmenities: dataFromForm.nearbyAmenities
        ? dataFromForm.nearbyAmenities
            .split(",")
            .map((a: string) => a.trim())
            .filter((a: string) => a)
        : [],
      heatingType: dataFromForm.heatingType,
      plotSize: dataFromForm.plotSize ? parseInt(dataFromForm.plotSize, 10) : undefined,
      garageSpaces: dataFromForm.garageSpaces,
      basement: dataFromForm.basement,
      balconyTerrace: dataFromForm.balconyTerrace,
      renovation: dataFromForm.renovation,
      lakeDistance: dataFromForm.lakeDistance,
      publicTransport: dataFromForm.publicTransport,
      internetSpeed: dataFromForm.internetSpeed,
      noiseLevel: dataFromForm.noiseLevel,
      viewQuality: dataFromForm.viewQuality,
      flooring: dataFromForm.flooring,
      kitchen: dataFromForm.kitchen,
      bathroom: dataFromForm.bathroom,
      security: dataFromForm.security,
      smartHome: dataFromForm.smartHome,
      elevator: dataFromForm.elevator,
      wellness: dataFromForm.wellness,
      fireplace: dataFromForm.fireplace,
      airConditioning: dataFromForm.airConditioning,
      solarSystem: dataFromForm.solarSystem,
      electricCar: dataFromForm.electricCar,
      storageSpace: dataFromForm.storageSpace,
      marketAnalysis: {
        pricePerSqm: dataFromForm.marketAnalysis.pricePerSqm,
        marketTrend: dataFromForm.marketAnalysis.marketTrend,
        comparableProperties: dataFromForm.marketAnalysis.comparableProperties,
        investmentPotential: dataFromForm.marketAnalysis.investmentPotential,
      },
    };

    createPropertyMutation.mutate(propertyData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge 
            className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white font-medium border-emerald-600 dark:border-emerald-500" 
            data-testid={`badge-status-available`}
          >
            <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Verfügbar
          </Badge>
        );
      case "reserved":
        return (
          <Badge 
            className="bg-amber-600 text-white dark:bg-amber-500 dark:text-white font-medium border-amber-600 dark:border-amber-500" 
            data-testid={`badge-status-reserved`}
          >
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            Reserviert
          </Badge>
        );
      case "sold":
        return (
          <Badge 
            className="bg-red-600 text-white dark:bg-red-500 dark:text-white font-medium border-red-600 dark:border-red-500" 
            data-testid={`badge-status-sold`}
          >
            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Verkauft
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600" 
            data-testid={`badge-status-${status}`}
          >
            {status}
          </Badge>
        );
    }
  };

  const formatPrice = (price: string | number | null) => {
    if (!price) return "Preis auf Anfrage";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Immobilien verwalten</h2>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Immobilien verwalten
            </h2>
            <Dialog
              open={isNewPropertyModalOpen}
              onOpenChange={setIsNewPropertyModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Immobilie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neue Immobilie erstellen</DialogTitle>
                  <DialogDescription>
                    Geben Sie die Details für die neue Immobilie ein
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit(handleCreateProperty)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel *</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="z.B. Moderne Villa am Bodensee"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Typ *</Label>
                      <Select
                        value={watch("type")}
                        onValueChange={(value) => setValue("type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Immobilientyp wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ort *</Label>
                      <Select
                        value={watch("location")}
                        onValueChange={(value) => setValue("location", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ort wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Bodensee-Region - Priority Cities */}
                          {BODENSEE_CITIES.map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="andere">Andere Stadt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preis (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        {...register("price")}
                        placeholder="750000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Wohnfläche (m²)</Label>
                      <Input
                        id="size"
                        type="number"
                        {...register("size", { valueAsNumber: true })}
                        placeholder="120"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rooms">Zimmer</Label>
                      <Input
                        id="rooms"
                        type="number"
                        {...register("rooms", { valueAsNumber: true })}
                        placeholder="4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Schlafzimmer *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        {...register("bedrooms", { valueAsNumber: true })}
                        placeholder="4"
                        data-testid="input-bedrooms"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Badezimmer</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        {...register("bathrooms", { valueAsNumber: true })}
                        placeholder="2"
                        data-testid="input-bathrooms"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Baujahr</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="z.B. 2020"
                        {...register("yearBuilt", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={watch("status")}
                        onValueChange={(value) => setValue("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Verfügbar</SelectItem>
                          <SelectItem value="reserved">Reserviert</SelectItem>
                          <SelectItem value="sold">Verkauft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Zustand *</Label>
                      <Select
                        value={watch("condition")}
                        onValueChange={(value) => setValue("condition", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Zustand wählen" />
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

                  {/* Energieeffizienz & Heizung */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Energieeffizienz & Technik</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="energyClass">Energieeffizienzklasse</Label>
                        <Select
                          value={watch("energyClass")}
                          onValueChange={(value) => setValue("energyClass", value)}
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
                          value={watch("heatingType")}
                          onValueChange={(value) => setValue("heatingType", value)}
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
                  </div>

                  {/* Grundstück & Außenanlagen */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Grundstück & Außenanlagen</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plotSize">Grundstücksgröße (m²)</Label>
                        <Input
                          id="plotSize"
                          type="number"
                          placeholder="z.B. 500"
                          {...register("plotSize")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="garageSpaces">Garage/Stellplätze</Label>
                        <Select
                          value={watch("garageSpaces")}
                          onValueChange={(value) => setValue("garageSpaces", value)}
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
                          value={watch("basement")}
                          onValueChange={(value) => setValue("basement", value)}
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

                      <div className="space-y-2">
                        <Label htmlFor="balconyTerrace">Balkon/Terrasse</Label>
                        <Select
                          value={watch("balconyTerrace")}
                          onValueChange={(value) => setValue("balconyTerrace", value)}
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
                          value={watch("renovation")}
                          onValueChange={(value) => setValue("renovation", value)}
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
                  </div>

                  {/* Lage & Umgebung (Bodensee-spezifisch) */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Lage & Umgebung (Bodensee-Region)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lakeDistance">Entfernung zum Bodensee</Label>
                        <Select
                          value={watch("lakeDistance")}
                          onValueChange={(value) => setValue("lakeDistance", value)}
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
                          value={watch("viewQuality")}
                          onValueChange={(value) => setValue("viewQuality", value)}
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

                      <div className="space-y-2">
                        <Label htmlFor="publicTransport">ÖPNV-Anbindung</Label>
                        <Select
                          value={watch("publicTransport")}
                          onValueChange={(value) => setValue("publicTransport", value)}
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
                          value={watch("internetSpeed")}
                          onValueChange={(value) => setValue("internetSpeed", value)}
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
                          value={watch("noiseLevel")}
                          onValueChange={(value) => setValue("noiseLevel", value)}
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
                  </div>

                  {/* Innenausstattung */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Innenausstattung</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flooring">Bodenbeläge</Label>
                        <Select
                          value={watch("flooring")}
                          onValueChange={(value) => setValue("flooring", value)}
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
                          value={watch("kitchen")}
                          onValueChange={(value) => setValue("kitchen", value)}
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
                          value={watch("bathroom")}
                          onValueChange={(value) => setValue("bathroom", value)}
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
                  </div>

                  {/* Sicherheit & Smart Home */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Sicherheit & Smart Home</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="security">Sicherheitsausstattung</Label>
                        <Select
                          value={watch("security")}
                          onValueChange={(value) => setValue("security", value)}
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
                          value={watch("smartHome")}
                          onValueChange={(value) => setValue("smartHome", value)}
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
                          value={watch("elevator")}
                          onValueChange={(value) => setValue("elevator", value)}
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
                  </div>

                  {/* Wellness & Komfort */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Wellness & Komfort</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wellness">Wellness-Bereich</Label>
                        <Select
                          value={watch("wellness")}
                          onValueChange={(value) => setValue("wellness", value)}
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
                          value={watch("fireplace")}
                          onValueChange={(value) => setValue("fireplace", value)}
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
                          value={watch("airConditioning")}
                          onValueChange={(value) => setValue("airConditioning", value)}
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
                  </div>

                  {/* Energietechnik */}
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Zusätzliche Energietechnik</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="solarSystem">Solaranlage</Label>
                        <Select
                          value={watch("solarSystem")}
                          onValueChange={(value) => setValue("solarSystem", value)}
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
                          value={watch("electricCar")}
                          onValueChange={(value) => setValue("electricCar", value)}
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
                          value={watch("storageSpace")}
                          onValueChange={(value) => setValue("storageSpace", value)}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Detaillierte Beschreibung der Immobilie..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="features">
                      Ausstattung (kommagetrennt)
                    </Label>
                    <Textarea
                      id="features"
                      {...register("features")}
                      placeholder="Balkon, Garage, Garten, Keller, etc."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nearbyAmenities">
                      Nahegelegene Annehmlichkeiten (kommagetrennt)
                    </Label>
                    <Textarea
                      id="nearbyAmenities"
                      {...register("nearbyAmenities")}
                      placeholder="z.B. Seezugang, Bahnhof, Schulen, Einkaufszentrum, Restaurants, Ärzte, Apotheken"
                      rows={2}
                    />
                  </div>

                  <PropertyImageSelector
                    selectedImages={newProperty.images || []}
                    onImagesChange={(images) =>
                      setNewProperty((prev) => ({ ...prev, images }))
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearBuilt">Baujahr</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="z.B. 2020"
                        {...register("yearBuilt", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="energyClass">
                        Energieeffizienzklasse
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("energyClass", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen Sie eine Klasse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                          <SelectItem value="G">G</SelectItem>
                          <SelectItem value="H">H</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Agent Notes */}
                  <div>
                    <Label htmlFor="agentNotes">Makler-Notizen (intern)</Label>
                    <Textarea
                      id="agentNotes"
                      placeholder="Interne Notizen, Marktanalyse, Verkaufsstrategie..."
                      {...register("agentNotes")}
                      rows={3}
                    />
                  </div>

                  {/* Market Analysis */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-4">Marktanalyse</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pricePerSqm">Preis pro m²</Label>
                        <Input
                          id="pricePerSqm"
                          type="number"
                          placeholder="z.B. 7500"
                          {...register("marketAnalysis.pricePerSqm", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marketTrend">Markttrend</Label>
                        <Select
                          onValueChange={(value) =>
                            setValue("marketAnalysis.marketTrend", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Trend auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="steigend">Steigend</SelectItem>
                            <SelectItem value="stabil">Stabil</SelectItem>
                            <SelectItem value="fallend">Fallend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="comparableProperties">
                          Vergleichsobjekte
                        </Label>
                        <Input
                          id="comparableProperties"
                          placeholder="z.B. ähnliche Objekte 850.000-950.000€"
                          {...register("marketAnalysis.comparableProperties")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="investmentPotential">
                          Investitionspotential
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            setValue(
                              "marketAnalysis.investmentPotential",
                              value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Potential bewerten" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hoch">Hoch</SelectItem>
                            <SelectItem value="mittel">Mittel</SelectItem>
                            <SelectItem value="niedrig">Niedrig</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewPropertyModalOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[var(--ruskin-blue)] hover:bg-[var(--ruskin-blue)]/90"
                      disabled={createPropertyMutation.isPending}
                    >
                      {createPropertyMutation.isPending
                        ? "Wird erstellt..."
                        : "Immobilie erstellen"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select
              value={filters.type || undefined}
              onValueChange={(value) => handleFilterChange("type", value || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.location || undefined}
              onValueChange={(value) =>
                handleFilterChange("location", value || "")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Orte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Orte</SelectItem>
                {BODENSEE_CITIES.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || undefined}
              onValueChange={(value) =>
                handleFilterChange("status", value || "")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="available">Verfügbar</SelectItem>
                <SelectItem value="reserved">Reserviert</SelectItem>
                <SelectItem value="sold">Verkauft</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                placeholder="Suchen..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pr-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Properties Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Immobilie
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Typ
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Ort
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Preis
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data as any)?.properties?.map((property: any) => (
                  <tr
                    key={property.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {property.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {property.rooms && (
                              <div className="flex items-center space-x-1">
                                <Bed className="w-4 h-4" />
                                <span>{property.rooms}</span>
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="flex items-center space-x-1">
                                <Bath className="w-4 h-4" />
                                <span>{property.bathrooms}</span>
                              </div>
                            )}
                            {property.size && (
                              <div className="flex items-center space-x-1">
                                <Square className="w-4 h-4" />
                                <span>{property.size} m²</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{property.type}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{property.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {formatPrice(property.price)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(property.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProperty(property);
                            setEditPropertyModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deletePropertyMutation.mutate(property.id)
                          }
                          disabled={deletePropertyMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProperty(property);
                            setViewPropertyModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Keine Immobilien gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data as any)?.total > 10 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Zeige 1-{Math.min(10, (data as any)?.total || 0)} von{" "}
                {(data as any)?.total || 0} Immobilien
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[var(--ruskin-blue)] text-white"
                >
                  {filters.page}
                </Button>
                <Button variant="outline" size="sm">
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Property Modal */}
      <Dialog
        open={editPropertyModalOpen}
        onOpenChange={setEditPropertyModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Immobilie bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Details der ausgewählten Immobilie.
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <EditPropertyForm
              property={selectedProperty}
              onSuccess={() => {
                setEditPropertyModalOpen(false);
                setSelectedProperty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Property Modal */}
      <Dialog
        open={viewPropertyModalOpen}
        onOpenChange={setViewPropertyModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Immobilie ansehen</DialogTitle>
            <DialogDescription>
              Detailansicht der ausgewählten Immobilie.
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <ViewPropertyDetails property={selectedProperty} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// EditPropertyForm Component
function EditPropertyForm({
  property,
  onSuccess,
}: {
  property: any;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState({
    title: property.title || "",
    description: property.description || "",
    type: property.type || "",
    location: property.location || "",
    price: property.price || "",
    size: property.size || "",
    rooms: property.rooms || "",
    bedrooms: property.bedrooms || "",
    bathrooms: property.bathrooms || "",
    status: property.status || "available",
    images: property.images || [],
    energyClass: property.energyClass || "",
    agentNotes: property.agentNotes || "",
    // Neue AI-Bewertungsfelder
    condition: property.condition || "",
    nearbyAmenities: property.nearbyAmenities || "",
    heatingType: property.heatingType || "",
    plotSize: property.plotSize || "",
    garageSpaces: property.garageSpaces || "",
    basement: property.basement || "",
    balconyTerrace: property.balconyTerrace || "",
    renovation: property.renovation || "",
    lakeDistance: property.lakeDistance || "",
    publicTransport: property.publicTransport || "",
    internetSpeed: property.internetSpeed || "",
    noiseLevel: property.noiseLevel || "",
    viewQuality: property.viewQuality || "",
    flooring: property.flooring || "",
    kitchen: property.kitchen || "",
    bathroom: property.bathroom || "",
    security: property.security || "",
    smartHome: property.smartHome || "",
    elevator: property.elevator || "",
    wellness: property.wellness || "",
    fireplace: property.fireplace || "",
    airConditioning: property.airConditioning || "",
    solarSystem: property.solarSystem || "",
    electricCar: property.electricCar || "",
    storageSpace: property.storageSpace || "",
    marketAnalysis: {
      pricePerSqm: property.marketAnalysis?.pricePerSqm || 0,
      marketTrend: property.marketAnalysis?.marketTrend || "",
      comparableProperties: property.marketAnalysis?.comparableProperties || "",
      investmentPotential: property.marketAnalysis?.investmentPotential || "",
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest(`/api/properties/${property.id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Immobilie aktualisiert",
        description: "Die Immobilie wurde erfolgreich aktualisiert",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Immobilie konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePropertyMutation.mutate(editData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-title">Titel</Label>
          <Input
            id="edit-title"
            value={editData.title}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-type">Typ</Label>
          <Select
            value={editData.type}
            onValueChange={(value) =>
              setEditData((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Typ wählen" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-location">Ort</Label>
          <Input
            id="edit-location"
            value={editData.location}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, location: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-price">Preis</Label>
          <Input
            id="edit-price"
            value={editData.price}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, price: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-size">Größe (m²)</Label>
          <Input
            id="edit-size"
            type="number"
            value={editData.size}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, size: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit-rooms">Zimmer</Label>
          <Input
            id="edit-rooms"
            type="number"
            value={editData.rooms}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, rooms: e.target.value }))
            }
            data-testid="edit-input-rooms"
          />
        </div>
        <div>
          <Label htmlFor="edit-bedrooms">Schlafzimmer</Label>
          <Input
            id="edit-bedrooms"
            type="number"
            value={editData.bedrooms}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, bedrooms: e.target.value }))
            }
            data-testid="edit-input-bedrooms"
          />
        </div>
        <div>
          <Label htmlFor="edit-bathrooms">Badezimmer</Label>
          <Input
            id="edit-bathrooms"
            type="number"
            value={editData.bathrooms}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, bathrooms: e.target.value }))
            }
            data-testid="edit-input-bathrooms"
          />
        </div>
        <div>
          <Label htmlFor="edit-status">Status</Label>
          <Select
            value={editData.status}
            onValueChange={(value) =>
              setEditData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Verfügbar</SelectItem>
              <SelectItem value="reserved">Reserviert</SelectItem>
              <SelectItem value="sold">Verkauft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="edit-description">Beschreibung</Label>
        <Textarea
          id="edit-description"
          value={editData.description}
          onChange={(e) =>
            setEditData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="edit-energyClass">Energieeffizienzklasse</Label>
        <Select
          value={editData.energyClass}
          onValueChange={(value) =>
            setEditData((prev) => ({ ...prev, energyClass: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Wählen Sie eine Klasse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
            <SelectItem value="E">E</SelectItem>
            <SelectItem value="F">F</SelectItem>
            <SelectItem value="G">G</SelectItem>
            <SelectItem value="H">H</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="edit-agentNotes">Makler-Notizen (intern)</Label>
        <Textarea
          id="edit-agentNotes"
          value={editData.agentNotes}
          onChange={(e) =>
            setEditData((prev) => ({ ...prev, agentNotes: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-4">Marktanalyse</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-pricePerSqm">Preis pro m²</Label>
            <Input
              id="edit-pricePerSqm"
              type="number"
              value={editData.marketAnalysis.pricePerSqm}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  marketAnalysis: {
                    ...prev.marketAnalysis,
                    pricePerSqm: Number(e.target.value),
                  },
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="edit-marketTrend">Markttrend</Label>
            <Select
              value={editData.marketAnalysis.marketTrend}
              onValueChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  marketAnalysis: {
                    ...prev.marketAnalysis,
                    marketTrend: value,
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Trend auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="steigend">Steigend</SelectItem>
                <SelectItem value="stabil">Stabil</SelectItem>
                <SelectItem value="fallend">Fallend</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="edit-comparableProperties">Vergleichsobjekte</Label>
            <Input
              id="edit-comparableProperties"
              value={editData.marketAnalysis.comparableProperties}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  marketAnalysis: {
                    ...prev.marketAnalysis,
                    comparableProperties: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="edit-investmentPotential">
              Investitionspotential
            </Label>
            <Select
              value={editData.marketAnalysis.investmentPotential}
              onValueChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  marketAnalysis: {
                    ...prev.marketAnalysis,
                    investmentPotential: value,
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Potential bewerten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="niedrig">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <PropertyImageSelector
        selectedImages={editData.images}
        onImagesChange={(images) =>
          setEditData((prev) => ({ ...prev, images }))
        }
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={updatePropertyMutation.isPending}>
          {updatePropertyMutation.isPending ? "Speichern..." : "Speichern"}
        </Button>
      </div>
    </form>
  );
}

// ViewPropertyDetails Component
function ViewPropertyDetails({ property }: { property: any }) {
  const formatPrice = (price: string) => {
    if (!price || price === "Preis auf Anfrage")
      return price || "Preis auf Anfrage";
    const numPrice = parseFloat(price.replace(/[^\d]/g, ""));
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Grunddaten</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Titel:</span> {property.title}
            </div>
            <div>
              <span className="font-medium">Typ:</span> {property.type}
            </div>
            <div>
              <span className="font-medium">Ort:</span> {property.location}
            </div>
            <div>
              <span className="font-medium">Preis:</span>{" "}
              {formatPrice(property.price)}
            </div>
            {property.size && (
              <div>
                <span className="font-medium">Größe:</span> {property.size} m²
              </div>
            )}
            {property.rooms && (
              <div>
                <span className="font-medium">Zimmer:</span> {property.rooms}
              </div>
            )}
            {property.bedrooms && (
              <div>
                <span className="font-medium">Schlafzimmer:</span> {property.bedrooms}
              </div>
            )}
            {property.bathrooms && (
              <div>
                <span className="font-medium">Badezimmer:</span>{" "}
                {property.bathrooms}
              </div>
            )}
            <div>
              <span className="font-medium">Status:</span>
              <Badge
                variant={
                  property.status === "available"
                    ? "default"
                    : property.status === "reserved"
                      ? "secondary"
                      : "destructive"
                }
                className="ml-2"
              >
                {property.status === "available"
                  ? "Verfügbar"
                  : property.status === "reserved"
                    ? "Reserviert"
                    : "Verkauft"}
              </Badge>
            </div>
            {property.energyClass && (
              <div>
                <span className="font-medium">Energieeffizienzklasse:</span>{" "}
                {property.energyClass}
              </div>
            )}
            {property.yearBuilt && (
              <div>
                <span className="font-medium">Baujahr:</span>{" "}
                {property.yearBuilt}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Beschreibung</h3>
          <p className="text-sm text-gray-600">
            {property.description || "Keine Beschreibung verfügbar"}
          </p>
          {property.features && property.features.length > 0 && (
            <div>
              <h4 className="font-medium mt-4 mb-2">Ausstattung</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {property.features.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          {property.agentNotes && (
            <div>
              <h4 className="font-medium mt-4 mb-2">Makler-Notizen (intern)</h4>
              <p className="text-sm text-gray-600">{property.agentNotes}</p>
            </div>
          )}
        </div>
      </div>

      {property.marketAnalysis && (
        <div>
          <h3 className="font-semibold mt-6 mb-2">Marktanalyse</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {property.marketAnalysis.pricePerSqm && (
              <div>
                <span className="font-medium">Preis pro m²:</span>{" "}
                {new Intl.NumberFormat("de-DE").format(
                  property.marketAnalysis.pricePerSqm,
                )}{" "}
                €
              </div>
            )}
            {property.marketAnalysis.marketTrend && (
              <div>
                <span className="font-medium">Markttrend:</span>{" "}
                {property.marketAnalysis.marketTrend}
              </div>
            )}
            {property.marketAnalysis.investmentPotential && (
              <div>
                <span className="font-medium">Investitionspotential:</span>{" "}
                {property.marketAnalysis.investmentPotential}
              </div>
            )}
            {property.marketAnalysis.comparableProperties && (
              <div className="md:col-span-3">
                <span className="font-medium">Vergleichsobjekte:</span>{" "}
                {property.marketAnalysis.comparableProperties}
              </div>
            )}
          </div>
        </div>
      )}

      {property.images && property.images.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 mt-6">Bilder</h3>
          <div className="grid grid-cols-3 gap-4">
            {property.images.map((imageId: string, index: number) => (
              <div
                key={index}
                className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <img
                  src={`/api/gallery/${imageId}/image`}
                  alt={`Immobilienbild ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="text-gray-400 text-sm">Bild nicht verfügbar</div>';
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}