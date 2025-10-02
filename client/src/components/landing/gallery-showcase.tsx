import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Eye,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  filename: string;
  url: string;
  category: string;
  caption?: string;
}

export default function GalleryShowcase() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data as fallback
  const mockImages: GalleryImage[] = [
    {
      id: "1",
      filename: "villa-bodensee-1.jpg",
      url: "/api/placeholder/800/600",
      category: "villa",
      caption: "Luxusvilla mit Seeblick",
    },
    {
      id: "2",
      filename: "apartment-konstanz-1.jpg",
      url: "/api/placeholder/800/600",
      category: "apartment",
      caption: "Moderne Wohnung in Konstanz",
    },
    {
      id: "3",
      filename: "house-meersburg-1.jpg",
      url: "/api/placeholder/800/600",
      category: "house",
      caption: "Einfamilienhaus in Meersburg",
    },
  ];

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/gallery");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.images) && data.images.length > 0) {
        setImages(data.images);
      } else {
        // Use mock data if no real images
        console.warn("No gallery images found, using mock data");
        setImages(mockImages);
      }
    } catch (err) {
      console.error("Error loading gallery:", err);
      setError("Galerie konnte nicht geladen werden");
      // Use mock data on error
      setImages(mockImages);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: "all", label: "Alle" },
    { key: "villa", label: "Villen" },
    { key: "apartment", label: "Wohnungen" },
    { key: "house", label: "Häuser" },
    { key: "commercial", label: "Gewerbe" },
  ];

  const filteredImages =
    selectedCategory === "all"
      ? images
      : images.filter((img) => img.category === selectedCategory);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + filteredImages.length) % filteredImages.length,
    );
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Immobilien-Galerie
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entdecken Sie unsere exklusiven Immobilien am Bodensee
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            <Button
              onClick={loadGalleryImages}
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              variant={
                selectedCategory === category.key ? "default" : "outline"
              }
              className="transition-all duration-300"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image, index) => (
              <Card
                key={image.id}
                className="group overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-0 relative">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.caption || `Immobilie ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `/api/placeholder/800/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <Button
                        onClick={() => openModal(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ansehen
                      </Button>
                    </div>
                  </div>
                  {image.caption && (
                    <div className="p-4">
                      <p className="text-sm text-gray-600">{image.caption}</p>
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 right-2 bg-white text-gray-800"
                    variant="secondary"
                  >
                    {image.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Keine Bilder gefunden
            </h3>
            <p className="text-gray-500">
              Für diese Kategorie sind derzeit keine Bilder verfügbar.
            </p>
          </div>
        )}

        {/* Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl w-full p-0">
            {filteredImages.length > 0 && (
              <div className="relative">
                <img
                  src={filteredImages[currentImageIndex]?.url}
                  alt={filteredImages[currentImageIndex]?.caption}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `/api/placeholder/800/600`;
                  }}
                />

                {filteredImages.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4"
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>

                {filteredImages[currentImageIndex]?.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                    <p className="text-center">
                      {filteredImages[currentImageIndex].caption}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
