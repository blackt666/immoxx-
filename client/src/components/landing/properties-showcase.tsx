
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bath,
  ArrowRight,
  Eye,
  ExternalLink,
  Home,
  Bed,
} from "lucide-react";

import { useLocation } from "wouter";
import TourModal from "./tour-modal";
import { ShareProperty } from "./share-property";

// Extended Property type with images for display
type PropertyWithImages = Partial<Property> & { 
  id: number;
  title: string;
  type: string;
  location: string;
  price: number;
  images?: string[];
};

// GARANTIERT OFFLINE - STATISCHE DATEN
const STATIC_PROPERTIES: PropertyWithImages[] = [
  {
    id: 1,
    title: "Luxusvilla am Bodensee",
    description: "Exklusive Villa mit direktem Seeblick",
    type: "villa",
    location: "Konstanz",
    city: "Konstanz",
    country: "Germany",
    price: 1200000,
    currency: "EUR",
    size: 250,
    rooms: null,
    bathrooms: 3,
    bedrooms: 5,
    status: "available",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: "Moderne Wohnung in Meersburg",
    description: "Helle Wohnung mit Balkon und Seeblick",
    type: "apartment",
    location: "Meersburg",
    city: "Meersburg",
    country: "Germany",
    price: 650000,
    currency: "EUR",
    size: 120,
    rooms: null,
    bathrooms: 2,
    bedrooms: 3,
    status: "available",
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: "Einfamilienhaus Friedrichshafen",
    description: "Gepflegtes Einfamilienhaus in ruhiger Lage",
    type: "house",
    location: "Friedrichshafen",
    city: "Friedrichshafen",
    country: "Germany",
    price: 850000,
    currency: "EUR",
    size: 180,
    rooms: null,
    bathrooms: 2,
    bedrooms: 4,
    status: "available",
    images: ["https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function PropertiesShowcase() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // API-Modus aktiviert - Properties werden vom Backend geladen
  const { data: properties, error } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  console.log("🔄 API Request sent to /api/properties");
  if (properties && Array.isArray(properties)) console.log("✅ Properties loaded from API:", properties.length);
  if (error) console.log("❌ API Error:", error);

  const openGoogleMaps = (location: string) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location + ", Deutschland")}`;
    window.open(mapsUrl, "_blank");
  };

  const openTour = (property: PropertyWithImages) => {
    setSelectedProperty(property as Property);
    setIsTourModalOpen(true);
  };

  const navigateToProperty = (propertyId: string | number) => {
    setLocation(`/property/${String(propertyId)}`);
  };

  // FALLBACK: Bei API-Fehlern nutze statische Daten
  const displayedProperties: PropertyWithImages[] = (properties && Array.isArray(properties) && properties.length > 0) ? properties : STATIC_PROPERTIES;
  
  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    console.log("🔒 Fallback: Using static properties due to API unavailability");
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: {
        label: "Verfügbar",
        className: "bg-green-100 text-green-800",
      },
      reserved: {
        label: "Reserviert",
        className: "bg-orange-100 text-orange-800",
      },
      sold: { label: "Verkauft", className: "bg-red-100 text-red-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.available;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatPrice = (price: string | number | undefined | null) => {
    if (price === undefined || price === null) return "Preis auf Anfrage";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "Preis ungültig";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <section id="properties" className="py-12 bg-[#F8F9FA]" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[#566B73]">
            Aktuelle Immobilien
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-[#8C837B]">
            Entdecken Sie unsere ausgewählten Immobilien in der Bodenseeregion –
            von modernen Villen bis zu charmanten Einfamilienhäusern
          </p>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {Array.isArray(displayedProperties) && displayedProperties.map((property: PropertyWithImages, index: number) => (
            <Card
              key={property.id}
              className={`group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{
                transitionDelay: `${index * 200}ms`,
              }}
            >
              <div
                className="relative overflow-hidden cursor-pointer"
                onClick={() => navigateToProperty(property.id)}
              >
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder-image.jpg";
                      target.alt = "Bild nicht verfügbar";
                      target.classList.add("opacity-50");
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Kein Bild</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(property.status || 'available')}
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {formatPrice(property.price)}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3
                  className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[var(--arctic-blue)] transition-colors cursor-pointer"
                  onClick={() => navigateToProperty(property.id)}
                >
                  {property.title}
                </h3>
                <div
                  className="flex items-center text-gray-600 mb-3 cursor-pointer hover:text-[var(--arctic-blue)] transition-colors"
                  onClick={() => openGoogleMaps(property.location)}
                  title="Auf Google Maps anzeigen"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm hover:underline">
                    {property.location}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                  {property.description ?? "Keine Beschreibung verfügbar"}
                </p>

                {/* Property Details */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    {property.size && (
                      <div className="flex items-center space-x-1">
                        <Home className="w-4 h-4" />
                        <span>{property.size} m²</span>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div className="flex items-center space-x-1">
                        <Bed className="w-4 h-4" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center space-x-1">
                        <Bath className="w-4 h-4" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-[var(--arctic-blue)] group-hover:text-white group-hover:border-[var(--arctic-blue)] transition-all duration-300"
                    onClick={() => navigateToProperty(property.id)}
                  >
                    Details ansehen
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTour(property);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      <Eye className="mr-2 w-4 h-4" />
                      360° Tour
                    </Button>

                    <ShareProperty
                      property={{
                        id: String(property.id),
                        title: property.title,
                        price: formatPrice(property.price),
                        location: property.location,
                        description: property.description ?? undefined,
                      }}
                      trigger={
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Portal Links Section */}
        <div
          className={`mt-16 transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Auch in folgenden Portalen
          </h3>

          <div className="flex justify-center items-center space-x-8 md:space-x-12">
            {/* Immowelt */}
            <div
              className="group cursor-pointer"
              onClick={() =>
                window.open(
                  "https://www.immowelt.de/profil/384820d0fa4a4aec811ae92c8f50d4b0",
                  "_blank",
                )
              }
            >
              <div className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform group-hover:-translate-y-1">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md border">
                  <svg
                    width="48"
                    height="18"
                    viewBox="0 0 400 72"
                    className="w-12 h-auto"
                  >
                    <defs>
                      <path
                        id="leftPill"
                        d="M8 8 L150 8 Q158 8 158 16 L158 56 Q158 64 150 64 L8 64 Q0 64 0 56 L0 16 Q0 8 8 8"
                      />
                      <path
                        id="rightPill"
                        d="M142 8 L392 8 Q400 8 400 16 L400 56 Q400 64 392 64 L142 64 Q134 64 134 56 L134 16 Q134 8 142 8"
                      />
                    </defs>
                    <use href="#leftPill" fill="#3A3B3C" />
                    <use href="#rightPill" fill="#FFD700" />
                    <text
                      x="79"
                      y="42"
                      textAnchor="middle"
                      fill="white"
                      fontSize="24"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                    >
                      immo
                    </text>
                    <text
                      x="267"
                      y="42"
                      textAnchor="middle"
                      fill="#3A3B3C"
                      fontSize="24"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                    >
                      welt
                    </text>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-500 transition-colors">
                  Immowelt
                </span>
              </div>
            </div>

            {/* ImmoScout24 */}
            <div
              className="group cursor-pointer"
              onClick={() =>
                window.open(
                  "https://www.immobilienscout24.de/anbieter/profil/bodensee-immobilien-manfred-mueller-88046-friedrichshafen",
                  "_blank",
                )
              }
            >
              <div className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform group-hover:-translate-y-1">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md border">
                  <svg
                    width="48"
                    height="24"
                    viewBox="0 0 512 256"
                    className="w-12 h-auto"
                  >
                    <defs>
                      <path
                        id="tealBanner"
                        d="M30 20 L420 20 Q460 20 480 50 L470 100 Q450 130 420 130 L30 130 Q10 130 0 100 L10 50 Q30 20 30 20"
                      />
                    </defs>
                    <use href="#tealBanner" fill="#00D4CC" />
                    <text
                      x="240"
                      y="90"
                      textAnchor="middle"
                      fill="#333"
                      fontSize="48"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                    >
                      Immo
                    </text>
                    <text
                      x="256"
                      y="200"
                      textAnchor="middle"
                      fill="#333"
                      fontSize="60"
                      fontWeight="600"
                      fontFamily="Arial, sans-serif"
                    >
                      Scout24
                    </text>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-500 transition-colors">
                  ImmoScout24
                </span>
              </div>
            </div>

            {/* Instagram */}
            <div
              className="group cursor-pointer"
              onClick={() =>
                window.open(
                  "https://www.instagram.com/immobilien_m.m/",
                  "_blank",
                )
              }
            >
              <div className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform group-hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-pink-500 transition-colors">
                  Instagram
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Modal */}
      {selectedProperty && (
        <TourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          property={selectedProperty}
        />
      )}
    </section>
  );
}
