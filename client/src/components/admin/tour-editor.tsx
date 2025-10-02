import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye } from "lucide-react";
import VirtualTour from "../landing/virtual-tour";
import { apiRequest } from "@/lib/queryClient";

interface TourEditorProps {
  propertyId: string;
}

interface TourHotspot {
  pitch: number;
  yaw: number;
  text: string;
  sceneId?: string;
  type: "info" | "scene";
}

interface TourScene {
  id: string;
  title: string;
  image: string;
  hotspots?: TourHotspot[];
}

interface TourConfig {
  propertyId: string;
  scenes: TourScene[];
}

export default function TourEditor({ propertyId }: TourEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();

  // Load tour configuration
  const { data: tourConfig, isLoading } = useQuery({
    queryKey: ["tour-config", propertyId],
    queryFn: () => apiRequest<TourConfig>(`/api/tours/${propertyId}`),
  });

  // Add hotspot mutation
  const addHotspotMutation = useMutation({
    mutationFn: ({
      sceneId,
      hotspot,
    }: {
      sceneId: string;
      hotspot: TourHotspot;
    }) =>
      apiRequest(`/api/tours/${propertyId}/scenes/${sceneId}/hotspots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotspot),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour-config", propertyId] });
    },
  });

  // Remove hotspot mutation
  const removeHotspotMutation = useMutation({
    mutationFn: ({
      sceneId,
      hotspotIndex,
    }: {
      sceneId: string;
      hotspotIndex: number;
    }) =>
      apiRequest(
        `/api/tours/${propertyId}/scenes/${sceneId}/hotspots/${hotspotIndex}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour-config", propertyId] });
    },
  });

  const handleAddHotspot = (sceneId: string, hotspot: TourHotspot) => {
    addHotspotMutation.mutate({ sceneId, hotspot });
  };

  const handleRemoveHotspot = (sceneId: string, hotspotIndex: number) => {
    removeHotspotMutation.mutate({ sceneId, hotspotIndex });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Tour wird geladen...</div>
        </CardContent>
      </Card>
    );
  }

  if (!tourConfig?.scenes || tourConfig.scenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>360° Tour Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Keine 360°-Bilder für diese Immobilie vorhanden. Laden Sie zuerst
            360°-Bilder in der Galerie hoch.
          </p>
          <Badge variant="outline">
            Tipp: Bilder werden automatisch als 360° erkannt
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>360° Tour Editor</span>
            <div className="flex space-x-2">
              <Button
                variant={isEditMode ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Vorschau
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Tour Statistiken:
            </h3>
            <div className="flex space-x-4">
              <Badge variant="outline">{tourConfig.scenes.length} Räume</Badge>
              <Badge variant="outline">
                {tourConfig.scenes.reduce(
                  (total, scene) => total + (scene.hotspots?.length || 0),
                  0,
                )}{" "}
                Hotspots
              </Badge>
            </div>
          </div>

          {isEditMode && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Hotspot-Editor Anleitung
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Klicken Sie auf "+" um Hotspot-Modus zu aktivieren</li>
                <li>
                  • Klicken Sie in das 360°-Bild, um Hotspots zu platzieren
                </li>
                <li>• Hotspots ermöglichen Navigation zwischen Räumen</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Virtual Tour Viewer/Editor */}
      <VirtualTour
        scenes={tourConfig.scenes}
        propertyTitle={`Tour für Immobilie ${propertyId}`}
        propertyId={propertyId}
        isEditMode={isEditMode}
        onHotspotAdded={handleAddHotspot}
        onHotspotRemoved={handleRemoveHotspot}
      />

      {/* Scene Management */}
      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle>Raum-Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tourConfig.scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{scene.title}</h4>
                    <p className="text-sm text-gray-600">
                      {scene.hotspots?.length || 0} Hotspots
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Raum {index + 1}</Badge>
                    {scene.hotspots?.map((hotspot, hotspotIndex) => (
                      <div
                        key={hotspotIndex}
                        className="flex items-center space-x-1"
                      >
                        <Badge variant="secondary" className="text-xs">
                          {hotspot.type === "scene" ? "🚪" : "ℹ️"}{" "}
                          {hotspot.text}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveHotspot(scene.id, hotspotIndex)
                          }
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
