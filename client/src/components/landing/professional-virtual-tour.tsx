import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Map,
  Info,
  Settings,
  Share2,
  Download,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  Compass,
  Grid,
  Layers,
  Home,
  Navigation,
  ZoomIn,
  ZoomOut,
  Move3D,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Enhanced interfaces for professional features
interface ProHotspot {
  id: string;
  pitch: number;
  yaw: number;
  text: string;
  description?: string;
  sceneId?: string;
  type: "info" | "scene" | "media" | "contact" | "external";
  icon?: string;
  color?: string;
  action?: {
    type: "navigate" | "popup" | "external" | "download";
    data: any;
  };
}

interface ProTourScene {
  id: string;
  title: string;
  image: string;
  thumbnailImage: string;
  description?: string;
  roomType: string;
  area?: number;
  floor?: number;
  position?: { x: number; y: number; z: number };
  hotspots?: ProHotspot[];
  metadata?: {
    captureDate?: string;
    camera?: string;
    resolution?: string;
    fileSize?: number;
    quality?: "low" | "medium" | "high" | "ultra";
  };
}

interface ProTourSettings {
  autoRotate: boolean;
  rotationSpeed: number;
  showCompass: boolean;
  showHotspots: boolean;
  showMinimap: boolean;
  allowFullscreen: boolean;
  initialScene?: string;
  theme: "light" | "dark" | "auto";
  language: string;
  analytics: boolean;
}

interface ProTourConfig {
  id: string;
  title: string;
  description?: string;
  propertyId: string;
  scenes: ProTourScene[];
  settings: ProTourSettings;
  branding?: {
    logo?: string;
    watermark?: string;
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

interface ProfessionalVirtualTourProps {
  tourConfig: ProTourConfig;
  onAnalytics?: (event: string, data: any) => void;
}

export default function ProfessionalVirtualTour({
  tourConfig,
  onAnalytics,
}: ProfessionalVirtualTourProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [pannellumViewer, setPannellumViewer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("tour");
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [tourProgress, setTourProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Professional settings with local state
  const [settings, setSettings] = useState<ProTourSettings>(
    tourConfig.settings,
  );

  const { toast } = useToast();

  // Analytics tracking
  const trackEvent = useCallback(
    (event: string, data: any) => {
      onAnalytics?.(event, data);

      // Send to backend analytics
      fetch(`/api/tours/pro/${tourConfig.id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data }),
        credentials: "include",
      }).catch((error) => console.warn("Analytics tracking failed:", error));
    },
    [tourConfig.id, onAnalytics],
  );

  // Initialize Pannellum viewer with professional settings
  useEffect(() => {
    const loadPannellum = async () => {
      try {
        if (typeof window !== "undefined" && !window.pannellum) {
          // Load Pannellum CSS
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
          document.head.appendChild(link);

          // Load Pannellum JS
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
          script.onload = initProfessionalViewer;
          script.onerror = () => setError("Failed to load 360° viewer library");
          document.head.appendChild(script);
        } else if (window.pannellum) {
          initProfessionalViewer();
        }
      } catch (error) {
        setError(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    const initProfessionalViewer = () => {
      if (
        !viewerRef.current ||
        tourConfig.scenes.length === 0 ||
        !window.pannellum
      ) {
        return;
      }

      try {
        setLoading(true);
        const currentSceneData = tourConfig.scenes[currentScene];

        console.log(
          `🎬 Initializing professional viewer for scene: ${currentSceneData.title}`,
        );

        const viewer = window.pannellum.viewer(viewerRef.current, {
          type: "equirectangular",
          panorama: currentSceneData.image,
          autoLoad: true,
          hotSpots: settings.showHotspots
            ? currentSceneData.hotspots?.map((hotspot) => ({
                id: hotspot.id,
                pitch: hotspot.pitch,
                yaw: hotspot.yaw,
                type: hotspot.type,
                text: hotspot.text,
                cssClass: `hotspot-${hotspot.type}`,
                clickHandlerFunc: () => handleHotspotClick(hotspot),
                createTooltipFunc: (hotSpotDiv: HTMLElement) => {
                  hotSpotDiv.title = hotspot.description || hotspot.text;
                  return hotSpotDiv;
                },
              })) || []
            : [],
          compass: settings.showCompass,
          showZoomCtrl: true,
          showFullscreenCtrl: false,
          keyboardZoom: true,
          mouseZoom: true,
          autoRotate: settings.autoRotate ? settings.rotationSpeed : 0,
          minHfov: 30,
          maxHfov: 120,
          hfov: 100,
          pitch: 0,
          yaw: 0,
        });

        viewer.on("load", () => {
          console.log("✅ Professional 360° viewer loaded successfully");
          setPannellumViewer(viewer);
          setLoading(false);
          setError(null);
          setViewStartTime(Date.now());
        });

        viewer.on("error", (error: any) => {
          console.error("❌ Pannellum viewer error:", error);
          setError("Failed to load 360° image");
          setLoading(false);
        });
      } catch (error) {
        console.error("❌ Error creating professional viewer:", error);
        setError(`Viewer creation failed: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    loadPannellum();

    return () => {
      if (pannellumViewer && typeof pannellumViewer.destroy === "function") {
        try {
          // Track scene view duration before cleanup
          const duration = Date.now() - viewStartTime;
          trackEvent("scene_view", {
            sceneId: tourConfig.scenes[currentScene].id,
            duration,
            sceneTitle: tourConfig.scenes[currentScene].title,
          });

          pannellumViewer.destroy();
        } catch (error) {
          console.error("Error destroying viewer:", error);
        }
      }
    };
  }, [
    currentScene,
    tourConfig.scenes,
    settings.showHotspots,
    settings.showCompass,
    settings.autoRotate,
    settings.rotationSpeed,
  ]);

  // Handle hotspot interactions
  const handleHotspotClick = (hotspot: ProHotspot) => {
    trackEvent("hotspot_click", {
      hotspotId: hotspot.id,
      hotspotType: hotspot.type,
      sceneId: tourConfig.scenes[currentScene].id,
    });

    switch (hotspot.type) {
      case "scene":
        if (hotspot.sceneId) {
          const sceneIndex = tourConfig.scenes.findIndex(
            (s) => s.id === hotspot.sceneId,
          );
          if (sceneIndex !== -1) {
            handleSceneChange(sceneIndex);
          }
        }
        break;
      case "info":
        toast({
          title: hotspot.text,
          description: hotspot.description || "Zusätzliche Informationen",
        });
        break;
      case "contact":
        if (hotspot.action?.type === "external") {
          window.open(hotspot.action.data.url, "_blank");
        }
        break;
      case "external":
        if (hotspot.action?.data?.url) {
          window.open(hotspot.action.data.url, "_blank");
        }
        break;
    }
  };

  const handleSceneChange = (sceneIndex: number) => {
    if (sceneIndex >= 0 && sceneIndex < tourConfig.scenes.length) {
      // Track previous scene duration
      const duration = Date.now() - viewStartTime;
      trackEvent("scene_view", {
        sceneId: tourConfig.scenes[currentScene].id,
        duration,
        sceneTitle: tourConfig.scenes[currentScene].title,
      });

      setCurrentScene(sceneIndex);
      setViewStartTime(Date.now());
    }
  };

  const toggleAutoRotate = () => {
    const newAutoRotate = !settings.autoRotate;
    setSettings((prev) => ({ ...prev, autoRotate: newAutoRotate }));

    if (
      pannellumViewer &&
      typeof pannellumViewer.setAutoRotate === "function"
    ) {
      pannellumViewer.setAutoRotate(newAutoRotate ? settings.rotationSpeed : 0);
    }
  };

  const resetView = () => {
    if (pannellumViewer) {
      try {
        pannellumViewer.setPitch(0);
        pannellumViewer.setYaw(0);
        pannellumViewer.setHfov(100);
        trackEvent("view_reset", {
          sceneId: tourConfig.scenes[currentScene].id,
        });
      } catch (error) {
        console.error("Error resetting view:", error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (settings.allowFullscreen) {
      setIsFullscreen(!isFullscreen);
      if (
        pannellumViewer &&
        typeof pannellumViewer.toggleFullscreen === "function"
      ) {
        pannellumViewer.toggleFullscreen();
      }
    }
  };

  const shareVirtualTour = async () => {
    const shareData = {
      title: `${tourConfig.title} - Professionelle 360° Tour`,
      text: `Erleben Sie diese beeindruckende Immobilie in einer professionellen 360° Tour!`,
      url: `${window.location.origin}/tours/${tourConfig.id}`,
    };

    trackEvent("tour_share", { method: "native" });

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          await fallbackShare(shareData.url);
        }
      }
    } else {
      await fallbackShare(shareData.url);
    }
  };

  const fallbackShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link kopiert!",
        description: "Der Link zur professionellen Tour wurde kopiert.",
      });
    } catch (error) {
      toast({
        title: "Fehler beim Teilen",
        description: "Der Link konnte nicht kopiert werden.",
        variant: "destructive",
      });
    }
  };

  // Update progress
  useEffect(() => {
    setTourProgress(((currentScene + 1) / tourConfig.scenes.length) * 100);
  }, [currentScene, tourConfig.scenes.length]);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Camera className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            360° Tour Fehler
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Neu laden
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tourConfig.scenes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Professionelle 360° Tour
          </h3>
          <p className="text-gray-600">Keine 360° Szenen verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const currentSceneData = tourConfig.scenes[currentScene];

  return (
    <div
      className={`w-full h-full flex flex-col bg-black ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      {/* Professional Progress Bar */}
      <div className="w-full bg-gray-900 h-2 flex-shrink-0 relative">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 transition-all duration-500"
          style={{ width: `${tourProgress}%` }}
        />
        <div className="absolute inset-0 flex justify-between items-center px-2">
          <span className="text-xs text-white/70">
            {currentScene + 1}/{tourConfig.scenes.length}
          </span>
          <span className="text-xs text-white/70">
            {Math.round(tourProgress)}%
          </span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full h-full flex flex-col"
      >
        <TabsList className="w-full justify-start border-b rounded-none bg-gray-900 p-0 flex-shrink-0">
          <TabsTrigger
            value="tour"
            className="flex items-center gap-2 text-white border-b-2 border-transparent data-[state=active]:border-cyan-400"
          >
            <Camera className="w-4 h-4" />
            360° Tour
          </TabsTrigger>
          <TabsTrigger
            value="navigation"
            className="flex items-center gap-2 text-white border-b-2 border-transparent data-[state=active]:border-cyan-400"
          >
            <Map className="w-4 h-4" />
            Szenen
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex items-center gap-2 text-white border-b-2 border-transparent data-[state=active]:border-cyan-400"
          >
            <Info className="w-4 h-4" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 text-white border-b-2 border-transparent data-[state=active]:border-cyan-400"
          >
            <Settings className="w-4 h-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 text-white border-b-2 border-transparent data-[state=active]:border-cyan-400"
          >
            <Activity className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tour" className="m-0 flex-1 flex flex-col">
          <div className="relative h-full">
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4" />
                  <p>Lade professionelle 360° Tour...</p>
                </div>
              </div>
            )}

            {/* Main Professional Viewer */}
            <div
              ref={viewerRef}
              className="w-full h-full min-h-[500px] overflow-hidden"
              style={{ background: "#000" }}
            />

            {/* Professional Tour Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/20">
                <h4 className="font-bold text-lg">{tourConfig.title}</h4>
                <p className="text-sm opacity-90 mb-1">
                  {currentSceneData.title}
                </p>
                <div className="flex items-center gap-3 text-xs opacity-75">
                  {currentSceneData.area && (
                    <span className="flex items-center gap-1">
                      <Grid className="w-3 h-3" />
                      {currentSceneData.area}m²
                    </span>
                  )}
                  {currentSceneData.floor && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {currentSceneData.floor}. OG
                    </span>
                  )}
                  {currentSceneData.metadata?.quality && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {currentSceneData.metadata.quality.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleAutoRotate}
                  className="bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm"
                >
                  {settings.autoRotate ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={resetView}
                  className="bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                {settings.allowFullscreen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleFullscreen}
                    className="bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shareVirtualTour}
                  className="bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Professional Scene Navigation */}
            {tourConfig.scenes.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-white">
                      <span className="text-sm font-medium">
                        {currentSceneData.title}
                      </span>
                      <p className="text-xs opacity-75">
                        Szene {currentScene + 1} von {tourConfig.scenes.length}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSceneChange(currentScene - 1)}
                        disabled={currentScene === 0}
                        className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                      >
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSceneChange(currentScene + 1)}
                        disabled={currentScene === tourConfig.scenes.length - 1}
                        className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                      >
                        →
                      </Button>
                    </div>
                  </div>

                  {/* Scene Thumbnails */}
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {tourConfig.scenes.map((scene, index) => (
                      <Button
                        key={scene.id}
                        size="sm"
                        variant={
                          index === currentScene ? "default" : "secondary"
                        }
                        onClick={() => handleSceneChange(index)}
                        className={`whitespace-nowrap flex items-center gap-2 ${
                          index === currentScene
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        <img
                          src={scene.thumbnailImage}
                          alt={scene.title}
                          className="w-6 h-4 object-cover rounded"
                        />
                        {scene.title}
                        {scene.area && (
                          <span className="text-xs opacity-75">
                            {scene.area}m²
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Watermark */}
            {tourConfig.branding?.watermark && (
              <div className="absolute bottom-4 right-4">
                <div className="bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
                  {tourConfig.branding.watermark}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Enhanced Navigation Tab */}
        <TabsContent value="navigation" className="p-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Professionelle Szenen-Navigation
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("desktop")}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("tablet")}
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("mobile")}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div
              className={`grid gap-4 ${
                viewMode === "mobile"
                  ? "grid-cols-1"
                  : viewMode === "tablet"
                    ? "grid-cols-2"
                    : "grid-cols-3"
              }`}
            >
              {tourConfig.scenes.map((scene, index) => (
                <Card
                  key={scene.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    index === currentScene
                      ? "ring-2 ring-cyan-400 shadow-cyan-400/25"
                      : ""
                  }`}
                  onClick={() => {
                    handleSceneChange(index);
                    setActiveTab("tour");
                  }}
                >
                  <CardContent className="p-3">
                    <div className="aspect-video bg-gray-200 rounded mb-3 relative overflow-hidden">
                      <img
                        src={scene.thumbnailImage}
                        alt={scene.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {index === currentScene && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {scene.metadata?.quality?.toUpperCase() || "HD"}
                        </Badge>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">
                      {scene.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{scene.roomType}</span>
                      {scene.area && <span>{scene.area}m²</span>}
                    </div>
                    {scene.hotspots && scene.hotspots.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <MousePointer className="w-3 h-3 text-cyan-500" />
                        <span className="text-xs text-cyan-600">
                          {scene.hotspots.length} interaktive Punkte
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Enhanced Info Tab */}
        <TabsContent value="info" className="p-4">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              Detaillierte Raum-Informationen
            </h3>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={currentSceneData.thumbnailImage}
                    alt={currentSceneData.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">
                      {currentSceneData.title}
                    </h4>
                    <p className="text-gray-600 mb-2">
                      {currentSceneData.description ||
                        `360° Rundblick durch ${currentSceneData.roomType}`}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {currentSceneData.roomType}
                      </Badge>
                      {currentSceneData.metadata?.quality && (
                        <Badge variant="secondary">
                          {currentSceneData.metadata.quality.toUpperCase()}{" "}
                          Quality
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {currentSceneData.area && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium block">Fläche</span>
                      <span className="text-gray-600">
                        {currentSceneData.area}m²
                      </span>
                    </div>
                  )}
                  {currentSceneData.floor && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium block">Stockwerk</span>
                      <span className="text-gray-600">
                        {currentSceneData.floor}. OG
                      </span>
                    </div>
                  )}
                  {currentSceneData.metadata?.resolution && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium block">Auflösung</span>
                      <span className="text-gray-600">
                        {currentSceneData.metadata.resolution}
                      </span>
                    </div>
                  )}
                  {currentSceneData.metadata?.captureDate && (
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium block">Aufnahmedatum</span>
                      <span className="text-gray-600">
                        {new Date(
                          currentSceneData.metadata.captureDate,
                        ).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Hotspots Overview */}
                {currentSceneData.hotspots &&
                  currentSceneData.hotspots.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-semibold mb-3">
                        Interaktive Bereiche
                      </h5>
                      <div className="space-y-2">
                        {currentSceneData.hotspots.map((hotspot, index) => (
                          <div
                            key={hotspot.id}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-${hotspot.color || "blue-500"}`}
                            />
                            <div className="flex-1">
                              <span className="font-medium">
                                {hotspot.text}
                              </span>
                              {hotspot.description && (
                                <p className="text-xs text-gray-600">
                                  {hotspot.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {hotspot.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Settings Tab */}
        <TabsContent value="settings" className="p-4">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">
              Professionelle Tour-Einstellungen
            </h3>

            {/* View Controls */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4">Ansichts-Steuerung</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Auto-Rotation</span>
                      <p className="text-sm text-gray-600">
                        Automatisches Drehen der 360° Ansicht
                      </p>
                    </div>
                    <Button
                      variant={settings.autoRotate ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAutoRotate}
                    >
                      {settings.autoRotate ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {settings.autoRotate && (
                    <div>
                      <Label>Rotationsgeschwindigkeit</Label>
                      <Slider
                        value={[Math.abs(settings.rotationSpeed)]}
                        onValueChange={([value]) => {
                          const newSpeed = -value; // Negative for left rotation
                          setSettings((prev) => ({
                            ...prev,
                            rotationSpeed: newSpeed,
                          }));
                          if (pannellumViewer && settings.autoRotate) {
                            pannellumViewer.setAutoRotate(newSpeed);
                          }
                        }}
                        max={10}
                        min={1}
                        step={0.5}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Geschwindigkeit: {Math.abs(settings.rotationSpeed)}x
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4">Anzeige-Optionen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Kompass</span>
                      <p className="text-sm text-gray-600">
                        Orientierungshilfe
                      </p>
                    </div>
                    <Button
                      variant={settings.showCompass ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          showCompass: !prev.showCompass,
                        }))
                      }
                    >
                      <Compass className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Hotspots</span>
                      <p className="text-sm text-gray-600">
                        Interaktive Punkte
                      </p>
                    </div>
                    <Button
                      variant={settings.showHotspots ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          showHotspots: !prev.showHotspots,
                        }))
                      }
                    >
                      <MousePointer className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Mini-Map</span>
                      <p className="text-sm text-gray-600">
                        Grundriss-Übersicht
                      </p>
                    </div>
                    <Button
                      variant={settings.showMinimap ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          showMinimap: !prev.showMinimap,
                        }))
                      }
                    >
                      <Map className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4">Professionelle Aktionen</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={resetView}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Ansicht zurücksetzen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareVirtualTour}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Tour teilen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = currentSceneData.image;
                      link.download = `${currentSceneData.title}_360.jpg`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Bild herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Analytics Tab */}
        <TabsContent value="analytics" className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tour-Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Szenen-Ansichten</span>
                  </div>
                  <div className="text-2xl font-bold">{currentScene + 1}</div>
                  <div className="text-sm text-gray-600">
                    von {tourConfig.scenes.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Verweildauer</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((Date.now() - viewStartTime) / 1000)}s
                  </div>
                  <div className="text-sm text-gray-600">aktuelle Szene</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Hotspots</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {currentSceneData.hotspots?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">in dieser Szene</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
