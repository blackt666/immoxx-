import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { VirtualTour } from "./real-virtual-tour";

interface TourModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function TourModal({
  property,
  isOpen,
  onClose,
}: TourModalProps) {
  // Fetch 360° images from gallery
  const { data: galleryImages } = useQuery({
    queryKey: ["/api/gallery"],
    enabled: isOpen,
  });

  // Filter for 360° images
  const tour360Images = Array.isArray(galleryImages)
    ? galleryImages.filter(
        (image: any) =>
          image.category === "360" || image.metadata?.type === "360",
      )
    : [];

  console.log("Available 360° images:", tour360Images);

  // Check if property has 360° tour images
  const has360Tour =
    property?.features?.has360Tour ||
    property?.features?.tour360Images?.length > 0 ||
    tour360Images.length > 0;

  if (!has360Tour) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] p-0"
        aria-describedby="tour-description"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>360° Tour - {property.title}</DialogTitle>
          <DialogDescription id="tour-description">
            Interaktive 360° Rundgang durch die Immobilie mit virtuellen
            Hotspots
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-full">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-4 py-2 rounded-lg">
            <h2 className="text-lg font-bold">360° Tour - {property.title}</h2>
            <p className="text-sm opacity-90">
              Interaktive 360° Rundgang durch die Immobilie
            </p>
          </div>

          {/* Virtual Tour Component */}
          <div className="w-full h-full">
            {tour360Images.length > 0 ? (
              <VirtualTour property={property} tour360Images={tour360Images} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Keine 360° Bilder verfügbar</p>
                  <p className="text-sm">
                    Laden Sie 360° Bilder im Admin-Bereich hoch
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
