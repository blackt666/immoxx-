import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Home, Bed, Bath, Square, Loader2 } from "lucide-react";
import { BODENSEE_CITIES, PROPERTY_TYPES } from "@shared/constants";
import type { Property } from "@shared/schema";


export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  // Fetch properties from API
  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: true
  });

  // Current filters from URL
  const currentFilters = useMemo(() => ({
    type: searchParams.get("type") || "",
    location: searchParams.get("location") || "",
    status: searchParams.get("status") || "available",
    search: searchParams.get("search") || "",
    page: parseInt(searchParams.get("page") || "1", 10)
  }), [searchParams]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    let filtered = properties;

    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(search) ||
        property.location.toLowerCase().includes(search) ||
        property.description?.toLowerCase().includes(search)
      );
    }

    if (currentFilters.type && currentFilters.type !== 'all') {
      filtered = filtered.filter(property => property.type === currentFilters.type);
    }

    if (currentFilters.location && currentFilters.location !== 'all') {
      // Filter by exact slug match since both property.location and filter use slugs
      filtered = filtered.filter(property => 
        property.location === currentFilters.location
      );
    }

    return filtered;
  }, [properties, currentFilters]);

  const updateFilters = useCallback((newFilters: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    if (!Object.prototype.hasOwnProperty.call(newFilters, "page")) {
      params.set("page", "1");
    }
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  }, [searchInput, updateFilters]);

  

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Immobilien werden geladen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <Home className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Fehler beim Laden der Immobilien
          </h3>
          <p className="mb-4">
            Bitte versuchen Sie es später erneut.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Immobilien am Bodensee
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Entdecken Sie unsere exklusiven Immobilien in den schönsten Lagen rund um den Bodensee
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Suchen Sie nach Ort, Titel oder Beschreibung..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={currentFilters.type}
              onValueChange={(value) => updateFilters({ type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Immobilientyp" />
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
              value={currentFilters.location}
              onValueChange={(value) => updateFilters({ location: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stadt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Städte</SelectItem>
                {BODENSEE_CITIES.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">
              <Search className="w-4 h-4 mr-2" />
              Suchen
            </Button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {filteredProperties.length} Immobilie{filteredProperties.length !== 1 ? "n" : ""} gefunden
        </div>
        {currentFilters.search && (
          <Badge variant="secondary">Suche: &quot;{currentFilters.search}&quot;</Badge>
        )}
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Immobilien gefunden
          </h3>
          <p className="text-gray-600 mb-4">
            Versuchen Sie es mit anderen Suchkriterien.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchInput("");
              setSearchParams({});
            }}
          >
            Filter zurücksetzen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <img
                  alt={property.title}
                  className="w-full h-48 object-cover aspect-[3/2]"
                  height="200"
                  src={property.slug ? `/images/properties/${property.slug}/01.jpg` : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"}
                  width="300"
                />
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{property.title}</h3>
                <p className="text-gray-500">{property.location}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(property.price)}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span><Bed className="inline-block mr-1 h-4 w-4" /> {property.bedrooms || '-'}</span>
                    <span><Bath className="inline-block mr-1 h-4 w-4" /> {property.bathrooms || '-'}</span>
                    <span><Square className="inline-block mr-1 h-4 w-4" /> {property.size ? `${property.size}m²` : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
