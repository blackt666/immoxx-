import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  Trash2,
  Plus,
  Settings,
  Eye,
  Download,
  Share2,
  BarChart,
  CheckCircle,
  AlertTriangle,
  Monitor,
} from "lucide-react";

interface Pro360Image {
  id: string;
  title: string;
  roomType: string;
  area?: number;
  floor?: number;
  file: File;
  preview?: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
}

interface PropertiesResponse {
  properties: Property[];
}

interface Tour {
  id: string;
  title: string;
  description?: string;
  images: TourImage[];
  scenes?: TourImage[]; // Add scenes property for compatibility
}

interface TourImage {
  id: string;
  url: string;
  title: string;
  roomType: string;
}

interface ToursResponse {
  tours: Tour[];
}

export default function ProfessionalTourManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState("");
  const [tourTitle, setTourTitle] = useState("");
  const [tourDescription, setTourDescription] = useState("");
  const [uploadQueue, setUploadQueue] = useState<Pro360Image[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing" | "complete" | "error"
  >("idle");

  const { data: properties } = useQuery<PropertiesResponse>({
    queryKey: ["/api/properties"],
  });

  const { data: existingTours } = useQuery<Tour[]>({
    queryKey: ["/api/tours/professional"],
    enabled: !!selectedProperty,
  });

  // Professional upload mutation with batch processing
  const uploadPro360Mutation = useMutation({
    mutationFn: async (data: {
      images: Pro360Image[];
      propertyId: string;
      tourData: any;
    }) => {
      setProcessingStatus("processing");
      const results = [];

      for (let i = 0; i < data.images.length; i++) {
        const image = data.images[i];
        const formData = new FormData();
        formData.append("image", image.file);
        formData.append("propertyId", data.propertyId);
        formData.append("title", image.title);
        formData.append("roomType", image.roomType);
        formData.append("area", image.area?.toString() || "");
        formData.append("floor", image.floor?.toString() || "1");
        formData.append(
          "description",
          `Professionelle 360° Aufnahme: ${image.title}`,
        );

        const response = await fetch("/api/tours/pro/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${image.title}`);
        }

        const result = await response.json();
        results.push(result);

        // Update progress
        toast({
          title: `Verarbeitung ${i + 1}/${data.images.length}`,
          description: `${image.title} erfolgreich verarbeitet`,
        });
      }

      return results;
    },
    onSuccess: (results) => {
      setProcessingStatus("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tours/professional"] });
      setUploadQueue([]);
      toast({
        title: "Professionelle Tour erstellt!",
        description: `${results.length} 360° Bilder wurden erfolgreich verarbeitet und optimiert.`,
      });
    },
    onError: (error) => {
      setProcessingStatus("error");
      console.error("Professional upload error:", error);
      toast({
        title: "Verarbeitungsfehler",
        description:
          error.message ||
          "Die professionelle Tour konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const addToQueue = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newImages: Pro360Image[] = Array.from(files)
        .map((file, index) => {
          // Validate file type and size
          if (!file.type.startsWith("image/")) {
            toast({
              title: "Ungültiger Dateityp",
              description: `${file.name} ist keine gültige Bilddatei`,
              variant: "destructive",
            });
            return null;
          }

          if (file.size > 50 * 1024 * 1024) {
            // 50MB limit
            toast({
              title: "Datei zu groß",
              description: `${file.name} ist größer als 50MB`,
              variant: "destructive",
            });
            return null;
          }

          return {
            id: `queue-${Date.now()}-${index}`,
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
            roomType: getRoomTypeFromFilename(file.name),
            file,
            preview: URL.createObjectURL(file),
          };
        })
        .filter(Boolean) as Pro360Image[];

      setUploadQueue((prev) => [...prev, ...newImages]);
    },
    [toast],
  );

  const removeFromQueue = (imageId: string) => {
    setUploadQueue((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      // Revoke object URLs to prevent memory leaks
      const removed = prev.find((img) => img.id === imageId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const updateQueueItem = (imageId: string, updates: Partial<Pro360Image>) => {
    setUploadQueue((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, ...updates } : img)),
    );
  };

  const processQueue = () => {
    if (!selectedProperty || !tourTitle || uploadQueue.length === 0) {
      toast({
        title: "Unvollständige Eingaben",
        description:
          "Immobilie, Tour-Titel und mindestens ein 360° Bild sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    uploadPro360Mutation.mutate({
      images: uploadQueue,
      propertyId: selectedProperty,
      tourData: {
        title: tourTitle,
        description: tourDescription,
      },
    });
  };

  function getRoomTypeFromFilename(filename: string): string {
    const name = filename.toLowerCase();

    if (name.includes("wohnzimmer") || name.includes("living"))
      return "Wohnzimmer";
    if (name.includes("schlafzimmer") || name.includes("bedroom"))
      return "Schlafzimmer";
    if (name.includes("küche") || name.includes("kitchen")) return "Küche";
    if (name.includes("badezimmer") || name.includes("bathroom"))
      return "Badezimmer";
    if (name.includes("flur") || name.includes("hallway")) return "Flur";
    if (name.includes("balkon") || name.includes("terrasse"))
      return "Außenbereich";
    if (name.includes("arbeitszimmer") || name.includes("office"))
      return "Arbeitszimmer";
    if (name.includes("kinderzimmer")) return "Kinderzimmer";
    if (name.includes("gästezimmer")) return "Gästezimmer";

    return "Wohnraum";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-500" />
            Professionelles 360° Tour-Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="property-select">Immobilie</Label>
              <Select
                value={selectedProperty}
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Immobilie für Tour auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {properties?.properties?.map((property: Property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tour-title">Tour-Titel</Label>
              <Input
                id="tour-title"
                value={tourTitle}
                onChange={(e) => setTourTitle(e.target.value)}
                placeholder="z.B. Luxuswohnung am Bodensee - Haupttour"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="tour-description">Tour-Beschreibung</Label>
              <Textarea
                id="tour-description"
                value={tourDescription}
                onChange={(e) => setTourDescription(e.target.value)}
                placeholder="Professionelle Beschreibung der 360° Tour..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>360° Bilder-Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-cyan-300 rounded-lg p-8 text-center bg-gradient-to-r from-blue-50 to-cyan-50">
            <Camera className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Professionelle 360° Bilder hochladen
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ziehen Sie equirectangular 360° Bilder hier hinein oder wählen Sie
              Dateien aus. Optimale Qualität: 4K+ Auflösung, 2:1
              Seitenverhältnis.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    addToQueue(target.files);
                  };
                  input.click();
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                360° Bilder auswählen (Mehrere möglich)
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Unterstützte Formate: JPG, PNG, WEBP</p>
                <p>• Empfohlene Auflösung: 4096x2048 oder höher</p>
                <p>• Maximale Dateigröße: 50MB pro Bild</p>
                <p>• Automatische Optimierung und Thumbnail-Erstellung</p>
              </div>
            </div>
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">
                Upload-Warteschlange ({uploadQueue.length} Bilder)
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadQueue.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    {image.preview && (
                      <img
                        src={image.preview}
                        alt={image.title}
                        className="w-20 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input
                        value={image.title}
                        onChange={(e) =>
                          updateQueueItem(image.id, { title: e.target.value })
                        }
                        placeholder="Raum-Titel"
                        className="h-8 text-sm"
                      />
                      <Select
                        value={image.roomType}
                        onValueChange={(value) =>
                          updateQueueItem(image.id, { roomType: value })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wohnzimmer">Wohnzimmer</SelectItem>
                          <SelectItem value="Schlafzimmer">
                            Schlafzimmer
                          </SelectItem>
                          <SelectItem value="Küche">Küche</SelectItem>
                          <SelectItem value="Badezimmer">Badezimmer</SelectItem>
                          <SelectItem value="Flur">Flur</SelectItem>
                          <SelectItem value="Arbeitszimmer">
                            Arbeitszimmer
                          </SelectItem>
                          <SelectItem value="Kinderzimmer">
                            Kinderzimmer
                          </SelectItem>
                          <SelectItem value="Außenbereich">
                            Außenbereich
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={image.area || ""}
                        onChange={(e) =>
                          updateQueueItem(image.id, {
                            area: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder="Fläche (m²)"
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={image.floor || ""}
                        onChange={(e) =>
                          updateQueueItem(image.id, {
                            floor: parseInt(e.target.value) || undefined,
                          })
                        }
                        placeholder="Stockwerk"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromQueue(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-blue-900">
                      Bereit für Verarbeitung
                    </h5>
                    <p className="text-sm text-blue-700">
                      {uploadQueue.length} Bilder werden professionell optimiert
                      und verarbeitet
                    </p>
                  </div>
                  <Button
                    onClick={processQueue}
                    disabled={
                      !selectedProperty ||
                      !tourTitle ||
                      uploadQueue.length === 0 ||
                      uploadPro360Mutation.isPending
                    }
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    {uploadPro360Mutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Verarbeitung läuft...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Professionelle Tour erstellen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Tours */}
      {existingTours && existingTours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bestehende Professionelle Touren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingTours.map((tour: Tour) => (
                <Card key={tour.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-cyan-500" />
                      <h4 className="font-medium truncate">{tour.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {tour.scenes?.length || 0} Szenen
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        Vorschau
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-3 h-3 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart className="w-3 h-3 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Professionelle 360° Richtlinien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Optimale Qualität
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  • <strong>Auflösung:</strong> Mindestens 4096x2048 (4K)
                </li>
                <li>
                  • <strong>Format:</strong> Equirectangular (2:1 Verhältnis)
                </li>
                <li>
                  • <strong>Dateigröße:</strong> Unter 50MB für beste
                  Performance
                </li>
                <li>
                  • <strong>Qualität:</strong> Hohe JPEG-Qualität (90%+)
                </li>
                <li>
                  • <strong>Beleuchtung:</strong> Gleichmäßig und hell
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-amber-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Häufige Probleme
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  • <strong>Falsche Proportionen:</strong> Kein 2:1
                  Seitenverhältnis
                </li>
                <li>
                  • <strong>Zu niedrige Auflösung:</strong> Unter 2048x1024
                </li>
                <li>
                  • <strong>Bewegungsunschärfe:</strong> Kamera nicht stabil
                </li>
                <li>
                  • <strong>Überbelichtung:</strong> Ausgebrannte Bereiche
                </li>
                <li>
                  • <strong>Parallax-Fehler:</strong> Sichtbare Stativ-Reste
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Profi-Tipp</h4>
            <p className="text-sm text-blue-800">
              Verwenden Sie eine professionelle 360° Kamera (Ricoh Theta,
              Insta360) oder erstellen Sie equirectangular Panoramen mit
              spezieller Software. Achten Sie auf gleichmäßige Beleuchtung und
              vermeiden Sie bewegliche Objekte im Raum während der Aufnahme.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
