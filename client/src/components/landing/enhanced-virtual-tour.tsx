import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Map,
  Info,
  Settings,
  Share2,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  Compass,
  Grid,
  Layers,
  Home,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend Window interface for Pannellum
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

export default function EnhancedVirtualTour({
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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);
  const { toast } = useToast();

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
            const viewer = window.pannellum.viewer(viewerRef.current, {
              type: "equirectangular",
              panorama: url,
              autoLoad: true,
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
              northOffset: 0,
              showZoomCtrl: true,
              keyboardZoom: true,
              mouseZoom: true,
              showFullscreenCtrl: false,
              autoRotate: isPlaying ? -2 : 0,
            });

            // Warten bis der Viewer vollständig geladen ist
            viewer.on("load", () => {
              setPannellumViewer(viewer);
            });
          } catch (error) {
            console.error("Error creating 360° viewer:", error);
          }
        };

        // Validate image URL
        const imageUrl = scenes[currentScene].image;
        console.log("Loading 360° image:", imageUrl);

        // Check if image exists before loading
        const img = new Image();
        img.onload = () => {
          console.log("360° image loaded successfully:", imageUrl);
          createViewer(imageUrl);
        };
        img.onerror = () => {
          console.error("Failed to load 360° image:", imageUrl);
          // Try fallback URL or show error
          if (imageUrl.startsWith("/uploads/")) {
            const fallbackUrl = `/api/gallery${imageUrl.replace("/uploads/", "/")}`;
            console.log("Trying fallback URL:", fallbackUrl);

            // Test fallback URL
            const fallbackImg = new Image();
            fallbackImg.onload = () => createViewer(fallbackUrl);
            fallbackImg.onerror = () => {
              console.error("Fallback URL also failed:", fallbackUrl);
              // Show error state in viewer
              if (viewerRef.current) {
                viewerRef.current.innerHTML = `
                    <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                      <div class="text-center">
                        <p class="text-lg mb-2">360° Bild nicht verfügbar</p>
                        <p class="text-sm">Das Bild konnte nicht geladen werden.</p>
                      </div>
                    </div>
                  `;
              }
            };
            fallbackImg.src = fallbackUrl;
          } else {
            // Show error state
            if (viewerRef.current) {
              viewerRef.current.innerHTML = `
                  <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                    <div class="text-center">
                      <p class="text-lg mb-2">360° Bild nicht verfügbar</p>
                      <p class="text-sm">Das Bild konnte nicht geladen werden.</p>
                    </div>
                  </div>
                `;
            }
          }
        };
        img.src = imageUrl;
      }
    };

    loadPannellum();

    return () => {
      if (pannellumViewer && typeof pannellumViewer.destroy === "function") {
        try {
          pannellumViewer.destroy();
        } catch (error) {
          console.error("Error destroying pannellum viewer:", error);
        }
      }
    };
  }, [currentScene, scenes, showHotspots, showCompass]);

  useEffect(() => {
    if (
      pannellumViewer &&
      typeof pannellumViewer.setAutoRotate === "function"
    ) {
      try {
        if (isPlaying) {
          pannellumViewer.setAutoRotate(-2);
        } else {
          pannellumViewer.setAutoRotate(0);
        }
      } catch (error) {
        console.error("Error setting auto rotate:", error);
      }
    }
  }, [isPlaying, pannellumViewer]);

  useEffect(() => {
    setTourProgress(((currentScene + 1) / scenes.length) * 100);
  }, [currentScene, scenes.length]);

  const handleSceneChange = (sceneIndex: number) => {
    setCurrentScene(sceneIndex);
  };

  const toggleAutoRotate = () => {
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    if (pannellumViewer) {
      try {
        if (typeof pannellumViewer.setPitch === "function") {
          pannellumViewer.setPitch(0);
        }
        if (typeof pannellumViewer.setYaw === "function") {
          pannellumViewer.setYaw(0);
        }
        if (typeof pannellumViewer.setHfov === "function") {
          pannellumViewer.setHfov(100);
        }
      } catch (error) {
        console.error("Error resetting view:", error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (
      pannellumViewer &&
      typeof pannellumViewer.toggleFullscreen === "function"
    ) {
      try {
        pannellumViewer.toggleFullscreen();
      } catch (error) {
        console.error("Error toggling fullscreen:", error);
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

  const shareVirtualTour = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `360° Tour - ${propertyTitle}`,
          text: `Schauen Sie sich diese beeindruckende 360° Tour an!`,
          url: window.location.href,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Fehler beim Teilen:", error);
          toast({
            title: "Fehler beim Teilen",
            description: "Die Tour konnte nicht geteilt werden.",
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link kopiert!",
          description:
            "Der Link zur 360° Tour wurde in die Zwischenablage kopiert.",
        });
      } catch (error) {
        console.error("Fehler beim Kopieren:", error);
        toast({
          title: "Fehler",
          description: "Der Link konnte nicht kopiert werden.",
          variant: "destructive",
        });
      }
    }
  };

  if (scenes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">360° Tour</h3>
          <p className="text-gray-600">Keine 360° Bilder verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1 flex-shrink-0">
        <div
          className="bg-[var(--arctic-blue)] h-1 transition-all duration-300"
          style={{ width: `${tourProgress}%` }}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full h-full flex flex-col"
      >
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 flex-shrink-0">
          <TabsTrigger value="tour" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Tour
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Navigation
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Informationen
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tour" className="m-0 flex-1 flex flex-col">
          <div className="relative h-full">
            {/* Main Viewer */}
            <div
              ref={viewerRef}
              className="w-full h-full min-h-[400px] overflow-hidden"
              style={{ background: "#000" }}
            />

            {/* Tour Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/70 text-white px-3 py-2 rounded-lg">
                <h4 className="font-semibold">{propertyTitle}</h4>
                <p className="text-sm opacity-90">
                  {scenes[currentScene].title}
                </p>
                {scenes[currentScene].area && (
                  <p className="text-xs opacity-75">
                    {scenes[currentScene].area}m²
                  </p>
                )}
              </div>

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
                  onClick={resetView}
                  className="bg-black/70 text-white hover:bg-black/80"
                >
                  <RotateCcw className="w-4 h-4" />
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
                      <p className="text-xs text-gray-500 mt-1">
                        {scene.area}m²
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info" className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Raum-Informationen</h3>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">
                  {scenes[currentScene].title}
                </h4>
                {scenes[currentScene].description && (
                  <p className="text-gray-600 mb-3">
                    {scenes[currentScene].description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {scenes[currentScene].roomType && (
                    <div>
                      <span className="font-medium">Raumtyp:</span>
                      <p className="text-gray-600">
                        {scenes[currentScene].roomType}
                      </p>
                    </div>
                  )}
                  {scenes[currentScene].area && (
                    <div>
                      <span className="font-medium">Fläche:</span>
                      <p className="text-gray-600">
                        {scenes[currentScene].area}m²
                      </p>
                    </div>
                  )}
                </div>
                {scenes[currentScene].hotspots &&
                  scenes[currentScene].hotspots.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">
                        Interaktive Punkte:
                      </span>
                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                        {scenes[currentScene].hotspots.map((hotspot, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[var(--arctic-blue)] rounded-full" />
                            {hotspot.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>
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
                  <h4 className="font-medium">Audio-Führung</h4>
                  <p className="text-sm text-gray-600">
                    Hintergrundmusik und Sprachführung
                  </p>
                </div>
                <Button
                  variant={audioEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
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
