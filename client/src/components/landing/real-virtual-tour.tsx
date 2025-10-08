import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Play,
  Pause,
  Home,
  Maximize,
  Share2,
  RotateCcw,
  Compass,
} from "lucide-react";

declare global {
  interface Window {
    pannellum: any;
  }
}

interface TourScene {
  id: string;
  title: string;
  image: string;
  description?: string;
  roomType?: string;
  area?: number;
  hotspots?: Array<{
    pitch: number;
    yaw: number;
    text: string;
    sceneId?: string;
    type?: "info" | "scene" | "media";
  }>;
}

interface VirtualTourProps {
  scenes: TourScene[];
  propertyTitle: string;
}

export default function RealVirtualTour({
  scenes,
  propertyTitle,
}: VirtualTourProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pannellumViewer, setPannellumViewer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("tour");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const [tourProgress, setTourProgress] = useState(0);

  useEffect(() => {
    const loadPannellum = async () => {
      if (typeof window !== "undefined" && !window.pannellum) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
        script.onload = initViewer;
        document.head.appendChild(script);
      } else if (window.pannellum) {
        initViewer();
      }
    };

    const initViewer = () => {
      if (viewerRef.current && scenes.length > 0 && window.pannellum) {
        const createViewer = (url: string) => {
          try {
            console.log("Initializing Pannellum viewer with 360° image:", url);

            // Clear previous viewer
            if (pannellumViewer) {
              pannellumViewer.destroy();
            }

            // Ensure the viewer container is ready
            if (!viewerRef.current) {
              console.error("Viewer container not ready");
              return null;
            }

            const viewer = window.pannellum.viewer(viewerRef.current, {
              type: "equirectangular",
              panorama: url,
              autoLoad: true,
              preview: url, // Add preview for better loading
              hotSpots: showHotspots
                ? scenes[currentScene].hotspots?.map((hotspot) => ({
                    pitch: hotspot.pitch,
                    yaw: hotspot.yaw,
                    type: hotspot.type || "info",
                    text: hotspot.text,
                    URL: hotspot.sceneId ? undefined : hotspot.text,
                    clickHandlerFunc: hotspot.sceneId
                      ? () => {
                          const sceneIndex = scenes.findIndex(
                            (s) => s.id === hotspot.sceneId,
                          );
                          if (sceneIndex !== -1) {
                            handleSceneChange(sceneIndex);
                          }
                        }
                      : undefined,
                  })) || []
                : [],
              compass: showCompass,
              showZoomCtrl: true,
              showFullscreenCtrl: false,
              showControls: true,
              mouseZoom: true,
              keyboardZoom: true,
              autoRotate: isPlaying ? 2 : 0, // Slightly faster rotation
              hfov: 100, // Horizontal field of view
              maxHfov: 150, // Maximum zoom out
              minHfov: 30, // Maximum zoom in
              pitch: 0, // Initial vertical angle
              yaw: 0, // Initial horizontal angle
              haov: 360, // Horizontal angle of view (full 360°)
              vaov: 180, // Vertical angle of view (full 180°)
              backgroundColor: [0, 0, 0], // Black background
              crossOrigin: "anonymous", // Handle CORS if needed
            });

            viewer.on("load", () => {
              console.log("360° image loaded successfully");
            });

            viewer.on("error", (error: any) => {
              console.error("Error loading 360° image:", error);
            });

            setPannellumViewer(viewer);
            return viewer;
          } catch (error) {
            console.error("Error creating Pannellum viewer:", error);
            return null;
          }
        };

        createViewer(scenes[currentScene].image);
      }
    };

    loadPannellum();
  }, [scenes, currentScene, showHotspots, showCompass, isPlaying]);

  const handleSceneChange = (index: number) => {
    if (pannellumViewer && scenes[index]) {
      try {
        console.log("Changing to scene:", index, "Image:", scenes[index].image);

        // For Pannellum, we need to load a new panorama, not a scene
        pannellumViewer.loadScene({
          type: "equirectangular",
          panorama: scenes[index].image,
          hotSpots: showHotspots
            ? scenes[index].hotspots?.map((hotspot) => ({
                pitch: hotspot.pitch,
                yaw: hotspot.yaw,
                type: hotspot.type || "info",
                text: hotspot.text,
                clickHandlerFunc: hotspot.sceneId
                  ? () => {
                      const sceneIndex = scenes.findIndex(
                        (s) => s.id === hotspot.sceneId,
                      );
                      if (sceneIndex !== -1) {
                        handleSceneChange(sceneIndex);
                      }
                    }
                  : undefined,
              })) || []
            : [],
        });

        setCurrentScene(index);
        setTourProgress(((index + 1) / scenes.length) * 100);
      } catch (error) {
        console.error("Error changing scene:", error);
        // Fallback: recreate the viewer with the new image
        if (viewerRef.current && window.pannellum) {
          pannellumViewer.destroy();
          const newViewer = window.pannellum.viewer(viewerRef.current, {
            type: "equirectangular",
            panorama: scenes[index].image,
            autoLoad: true,
            hfov: 100,
            maxHfov: 150,
            minHfov: 30,
            pitch: 0,
            yaw: 0,
            haov: 360,
            vaov: 180,
            backgroundColor: [0, 0, 0],
          });
          setPannellumViewer(newViewer);
          setCurrentScene(index);
          setTourProgress(((index + 1) / scenes.length) * 100);
        }
      }
    }
  };

  const nextScene = () => {
    if (currentScene < scenes.length - 1) {
      handleSceneChange(currentScene + 1);
    }
  };

  const previousScene = () => {
    if (currentScene > 0) {
      handleSceneChange(currentScene - 1);
    }
  };

  const toggleAutoRotate = () => {
    setIsPlaying(!isPlaying);
    if (pannellumViewer) {
      pannellumViewer.setUpdate(!isPlaying);
    }
  };

  const resetView = () => {
    if (pannellumViewer) {
      pannellumViewer.setPitch(0);
      pannellumViewer.setYaw(0);
      pannellumViewer.setHfov(100);
    }
  };

  const toggleFullscreen = () => {
    if (pannellumViewer && viewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        viewerRef.current.requestFullscreen();
      }
    }
  };

  const shareVirtualTour = () => {
    if (navigator.share) {
      navigator.share({
        title: `${propertyTitle} - 360° Virtual Tour`,
        text: `Erkunden Sie diese Immobilie in 360°`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link in die Zwischenablage kopiert!");
    }
  };

  if (scenes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Keine 360°-Tour verfügbar für diese Immobilie.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tour">360° Tour</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="tour" className="mt-4">
          <div
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ height: "500px" }}
          >
            <div
              ref={viewerRef}
              className="w-full h-full"
              style={{ minHeight: "500px" }}
            />

            {/* Tour Progress */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-black/70 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-semibold">
                    {scenes[currentScene].title}
                  </h3>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {scenes[currentScene].roomType}
                  </Badge>
                </div>
                <p className="text-white/80 text-sm mb-2">
                  {scenes[currentScene].description}
                </p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-[var(--arctic-blue)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${tourProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="absolute top-4 right-4">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleAutoRotate}
                  className="bg-black/70 text-white hover:bg-black/80"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleFullscreen}
                  className="bg-black/70 text-white hover:bg-black/80"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shareVirtualTour}
                  className="bg-black/70 text-white hover:bg-black/80"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scene Navigation */}
            {scenes.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-sm">
                      Szene {currentScene + 1} von {scenes.length}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={previousScene}
                        disabled={currentScene === 0}
                        className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                      >
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={nextScene}
                        disabled={currentScene === scenes.length - 1}
                        className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto">
                    {scenes.map((scene, index) => (
                      <Button
                        key={scene.id}
                        size="sm"
                        variant={
                          index === currentScene ? "default" : "secondary"
                        }
                        onClick={() => handleSceneChange(index)}
                        className={`whitespace-nowrap ${
                          index === currentScene
                            ? "bg-[var(--arctic-blue)] text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        <Home className="w-3 h-3 mr-1" />
                        {scene.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="navigation" className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Szenen-Übersicht</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {scenes.map((scene, index) => (
                <Card
                  key={scene.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    index === currentScene
                      ? "ring-2 ring-[var(--arctic-blue)]"
                      : ""
                  }`}
                  onClick={() => {
                    handleSceneChange(index);
                    setActiveTab("tour");
                  }}
                >
                  <CardContent className="p-3">
                    <div className="aspect-video bg-gray-200 rounded mb-2 relative overflow-hidden">
                      <img
                        src={scene.image}
                        alt={scene.title}
                        className="w-full h-full object-cover"
                      />
                      {index === currentScene && (
                        <div className="absolute inset-0 bg-[var(--arctic-blue)]/20 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm">{scene.title}</h4>
                    {scene.roomType && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {scene.roomType}
                      </Badge>
                    )}
                    {scene.area && (
                      <p className="text-xs text-gray-600 mt-1">
                        {scene.area} m²
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tour-Einstellungen</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Hotspots anzeigen</h4>
                  <p className="text-sm text-gray-600">
                    Interaktive Punkte in der Tour
                  </p>
                </div>
                <Button
                  variant={showHotspots ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowHotspots(!showHotspots)}
                >
                  {showHotspots ? "An" : "Aus"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Kompass anzeigen</h4>
                  <p className="text-sm text-gray-600">Orientierungshilfe</p>
                </div>
                <Button
                  variant={showCompass ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompass(!showCompass)}
                >
                  <Compass className="w-4 h-4 mr-1" />
                  {showCompass ? "An" : "Aus"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-Rotation</h4>
                  <p className="text-sm text-gray-600">
                    Automatisches Drehen der Ansicht
                  </p>
                </div>
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAutoRotate}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <hr />

              <div className="space-y-2">
                <h4 className="font-medium">Tour-Aktionen</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={resetView}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Ansicht zurücksetzen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="w-4 h-4 mr-1" />
                    Vollbild
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareVirtualTour}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Tour teilen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main VirtualTour component that uses real uploaded images
export const VirtualTour = ({
  property,
  tour360Images = [],
}: {
  property: any;
  tour360Images?: any[];
}) => {
  // Use passed tour360Images or fallback to property features
  const tourImages =
    tour360Images.length > 0
      ? tour360Images
      : property.features?.tour360Images || [];

  console.log("Property features:", property.features);
  console.log("Tour 360 images:", tourImages);

  const scenes: TourScene[] =
    tourImages.length > 0
      ? tourImages.map((imageData: any, index: number) => {
          const imageId =
            typeof imageData === "string" ? imageData : imageData.id;
          const title =
            typeof imageData === "object" && imageData.metadata?.title
              ? imageData.metadata.title
              : index === 0
                ? "Hauptraum"
                : index === 1
                  ? "Schlafzimmer"
                  : index === 2
                    ? "Küche"
                    : `Raum ${index + 1}`;

          return {
            id: `scene-${index}`,
            title,
            image: `/api/gallery/${imageId}/image`,
            description: `360° Rundblick: ${title}`,
            roomType: title,
            area: index === 0 ? 45 : index === 1 ? 25 : index === 2 ? 20 : 30,
            hotspots:
              index < tourImages.length - 1
                ? [
                    {
                      pitch: -10,
                      yaw: 90,
                      text: `Zur nächsten Szene`,
                      sceneId: `scene-${index + 1}`,
                      type: "scene" as const,
                    },
                  ]
                : tourImages.length > 1
                  ? [
                      {
                        pitch: -10,
                        yaw: 270,
                        text: "Zurück zum Anfang",
                        sceneId: "scene-0",
                        type: "scene" as const,
                      },
                    ]
                  : [],
          };
        })
      : [];

  return (
    <RealVirtualTour
      scenes={scenes}
      propertyTitle={property.title || "360° Tour"}
    />
  );
};
