import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Trash2, Plus } from "lucide-react";

export default function TourManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState("");

  const { data: properties } = useQuery<{properties: Array<{id: string; title: string}>}>({
    queryKey: ["/api/properties"],
  });

  const upload360ImageMutation = useMutation({
    mutationFn: async (data: {
      file: File;
      propertyId: string;
      title: string;
    }) => {
      const formData = new FormData();
      formData.append("image", data.file);
      formData.append("propertyId", data.propertyId);
      formData.append("title", data.title);
      formData.append("type", "360");

      const response = await fetch("/api/gallery/upload-360", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload fehlgeschlagen");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "360° Bild hochgeladen",
        description: "Das 360° Bild wurde erfolgreich hochgeladen",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das 360° Bild konnte nicht hochgeladen werden",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null, title: string) => {
    if (!files || !selectedProperty || !title) {
      toast({
        title: "Fehler",
        description:
          "Bitte wählen Sie eine Immobilie und geben Sie einen Titel ein",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Nur Bilddateien sind erlaubt",
        variant: "destructive",
      });
      return;
    }

    upload360ImageMutation.mutate({
      file,
      propertyId: selectedProperty,
      title,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              360° Touren verwalten
            </h2>
            <Camera className="w-6 h-6 text-[var(--arctic-blue)]" />
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                360° Bilder hochladen
              </h3>
              <p className="text-gray-600 mb-4">
                Laden Sie equirectangular 360° Bilder für Ihre Immobilien hoch
              </p>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="property-select">Immobilie auswählen</Label>
                  <Select
                    value={selectedProperty}
                    onValueChange={setSelectedProperty}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Immobilie wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.properties?.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      const title = prompt("Titel für diesen Raum eingeben:");
                      if (title) {
                        handleFileUpload(target.files, title);
                      }
                    };
                    input.click();
                  }}
                  disabled={
                    !selectedProperty || upload360ImageMutation.isPending
                  }
                  className="bg-[var(--arctic-blue)] hover:bg-[var(--arctic-blue)]/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {upload360ImageMutation.isPending
                    ? "Wird hochgeladen..."
                    : "360° Bild auswählen"}
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Hinweise für 360° Bilder:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Verwenden Sie equirectangular (2:1 Seitenverhältnis) 360°
                Bilder
              </li>
              <li>• Empfohlene Auflösung: mindestens 4096x2048 Pixel</li>
              <li>• Unterstützte Formate: JPG, PNG</li>
              <li>
                • Für beste Qualität: Verwenden Sie eine 360° Kamera oder
                spezialisierte Software
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
