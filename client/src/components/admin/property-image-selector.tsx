import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Image, Check } from "lucide-react";

interface PropertyImageSelectorProps {
  selectedImages: string[];
  onImagesChange: (images: string[]) => void;
}

export default function PropertyImageSelector({
  selectedImages,
  onImagesChange,
}: PropertyImageSelectorProps) {
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ["/api/gallery"],
  });

  const toggleImage = useCallback(
    (imageId: string) => {
      if (selectedImages.includes(imageId)) {
        onImagesChange(selectedImages.filter((id) => id !== imageId));
      } else {
        onImagesChange([...selectedImages, imageId]);
      }
    },
    [selectedImages, onImagesChange],
  );

  const selectAllImages = () => {
    if (galleryImages && Array.isArray(galleryImages)) {
      onImagesChange(galleryImages.map((img: any) => img.id));
    }
  };

  const clearSelection = () => {
    onImagesChange([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Bilder auswählen</Label>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--ruskin-blue)] mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Lade Bilder...</p>
        </div>
      </div>
    );
  }

  const images = Array.isArray(galleryImages) ? galleryImages : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Bilder auswählen ({selectedImages.length} ausgewählt)</Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllImages}
            disabled={images.length === 0}
          >
            Alle auswählen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={selectedImages.length === 0}
          >
            Auswahl löschen
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Keine Bilder in der Galerie</p>
            <p className="text-sm text-gray-500 mt-1">
              Laden Sie zuerst Bilder in die Galerie hoch
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
          {images.map((image: any) => {
            const is360Image =
              image.category === "360" || image.metadata?.type === "360";
            return (
              <div
                key={image.id}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImages.includes(image.id)
                    ? "border-[var(--arctic-blue)] ring-2 ring-[var(--arctic-blue)]/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || "Galerie Bild"}
                  className="w-full h-full object-cover"
                />
                {selectedImages.includes(image.id) && (
                  <div className="absolute inset-0 bg-[var(--arctic-blue)]/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
                {is360Image && (
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    360°
                  </div>
                )}
                <div
                  className="absolute top-2 left-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedImages.includes(image.id)}
                    onCheckedChange={(checked) => {
                      // Only toggle if the checked state differs from current state
                      const isCurrentlySelected = selectedImages.includes(
                        image.id,
                      );
                      if (checked !== isCurrentlySelected) {
                        toggleImage(image.id);
                      }
                    }}
                    className="bg-white/80"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
