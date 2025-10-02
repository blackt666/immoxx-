import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Plus,
  Edit,
  Camera,
} from "lucide-react";

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

interface VirtualTourProps {
  scenes: TourScene[];
  propertyTitle: string;
  propertyId?: string;
  isEditMode?: boolean;
  onHotspotAdded?: (sceneId: string, hotspot: TourHotspot) => void;
  onHotspotRemoved?: (sceneId: string, hotspotIndex: number) => void;
}

export default function VirtualTour({
  scenes,
  propertyTitle,
  propertyId,
  isEditMode = false,
  onHotspotAdded,
  onHotspotRemoved,
}: VirtualTourProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pannellumViewer, setPannellumViewer] = useState<any>(null);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [showHotspotDialog, setShowHotspotDialog] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState<{
    pitch: number;
    yaw: number;
  } | null>(null);
  const [targetSceneId, setTargetSceneId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log("🎬 VirtualTour initializing...", {
      scenesCount: scenes.length,
      currentScene,
      isEditMode,
    });

    if (scenes.length === 0) {
      setIsLoading(false);
      return;
    }

    const maxRetries = 3;

    const loadPannellumWithRetry = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadPannellumLibrary();
        await initializeViewer();

        setIsLoading(false);
        setRetryCount(0);
      } catch (error) {
        console.error("❌ Pannellum loading failed:", error);

        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
          setRetryCount((prev) => prev + 1);
          setTimeout(() => loadPannellumWithRetry(), 2000 * (retryCount + 1));
        } else {
          setError(`Fehler beim Laden der 360° Tour: ${(error as Error).message}`);
          setIsLoading(false);
          showErrorFallback();
        }
      }
    };

    loadPannellumWithRetry();

    return () => {
      if (pannellumViewer) {
        try {
          pannellumViewer.destroy();
          console.log("🧹 Pannellum viewer destroyed");
        } catch (error) {
          console.warn("⚠️ Error destroying viewer:", error);
        }
      }
    };
  }, [currentScene, scenes, retryCount]);

  const loadPannellumLibrary = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.pannellum) {
        console.log("✅ Pannellum already loaded");
        resolve();
        return;
      }

      console.log("📦 Loading Pannellum library...");

      // Load CSS first
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href =
        "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      cssLink.onerror = () => {
        console.warn(
          "⚠️ Pannellum CSS failed to load from primary CDN, trying backup...",
        );
        const backupLink = document.createElement("link");
        backupLink.rel = "stylesheet";
        backupLink.href =
          "https://unpkg.com/pannellum@2.5.6/build/pannellum.css";
        document.head.appendChild(backupLink);
      };
      document.head.appendChild(cssLink);

      // Add custom styles for mobile optimization
      const customStyles = document.createElement("style");
      customStyles.textContent = `
        /* Enhanced mobile-first 360° tour styles */
        .pnlm-container {
          touch-action: pan-x pan-y !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        
        .pnlm-hotspot div {
          background: linear-gradient(135deg, #3B82F6, #1D4ED8) !important;
          border: 2px solid #fff !important;
          border-radius: 50% !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
          transition: all 0.3s ease !important;
          min-width: 20px !important;
          min-height: 20px !important;
        }
        
        .pnlm-hotspot div:hover {
          transform: scale(1.2) !important;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6) !important;
        }
        
        /* Mobile touch optimization */
        @media (max-width: 768px) {
          .pnlm-hotspot div {
            min-width: 30px !important;
            min-height: 30px !important;
            font-size: 14px !important;
          }
          
          .pnlm-container {
            overflow: hidden !important;
          }
        }
        
        /* Hotspot categories */
        .hotspot-navigation {
          background: linear-gradient(135deg, #10B981, #059669) !important;
          animation: pulse-green 2s infinite !important;
        }
        
        .hotspot-info {
          background: linear-gradient(135deg, #F59E0B, #D97706) !important;
        }
        
        @keyframes pulse-green {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `;
      document.head.appendChild(customStyles);

      // Load JavaScript
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";

      script.onload = () => {
        console.log("✅ Pannellum JavaScript loaded successfully");
        setTimeout(resolve, 500); // Give it time to initialize
      };

      script.onerror = () => {
        console.warn("⚠️ Primary CDN failed, trying backup...");
        const backupScript = document.createElement("script");
        backupScript.src =
          "https://unpkg.com/pannellum@2.5.6/build/pannellum.js";

        backupScript.onload = () => {
          console.log("✅ Pannellum loaded from backup CDN");
          setTimeout(resolve, 500);
        };

        backupScript.onerror = () => {
          reject(new Error("Failed to load Pannellum from all CDN sources"));
        };

        document.head.appendChild(backupScript);
      };

      document.head.appendChild(script);
    });
  };

  const initializeViewer = async (): Promise<void> => {
    if (!viewerRef.current || !window.pannellum || scenes.length === 0) {
      throw new Error("Viewer initialization failed - missing dependencies");
    }

    const currentSceneData = scenes[currentScene];

    if (!currentSceneData.image) {
      throw new Error("360° image URL is missing");
    }

    // Test image accessibility
    await testImageAccessibility(currentSceneData.image);

    console.log(
      "🎯 Initializing Pannellum viewer for:",
      currentSceneData.title,
    );

    try {
      // Clear any existing content
      viewerRef.current.innerHTML = "";

      // Prepare hotspots with mobile optimization
      const hotspots = prepareHotspots(currentSceneData);

      const viewerConfig = {
        type: "equirectangular",
        panorama: currentSceneData.image,
        autoLoad: true,
        hotSpots: hotspots,
        compass: true,
        northOffset: 0,
        showZoomCtrl: true,
        keyboardZoom: true,
        mouseZoom: true,
        showFullscreenCtrl: false,
        autoRotate: isPlaying ? -2 : 0,
        crossOrigin: "anonymous",
        dynamic: true,
        // Mobile optimization
        touchPanSpeedCoeffFactor: 0.8,
        touchZoomSpeedCoeffFactor: 0.8,
        // Performance settings for Replit
        loadTimeout: 15000,
        backgroundColor: [0, 0, 0],
        preview: currentSceneData.image,
        // Field of view settings
        hfov: 100,
        minHfov: 50,
        maxHfov: 140,
        pitch: 0,
        yaw: 0,
      };

      console.log("🔧 Creating viewer with config:", {
        panorama: currentSceneData.image,
        hotspots: hotspots.length,
        autoRotate: isPlaying,
      });

      const viewer = window.pannellum.viewer(viewerRef.current, viewerConfig);

      // Enhanced event handling
      viewer.on("load", () => {
        console.log(
          "✅ 360° Tour loaded successfully:",
          currentSceneData.title,
        );

        // Mobile optimization after load
        if (isMobileDevice()) {
          viewer.setHfov(110); // Wider view for mobile
          console.log("📱 Mobile optimizations applied");
        }
      });

      viewer.on("error", (error: any) => {
        console.error("❌ Pannellum viewer error:", error);
        throw new Error(
          `Viewer error: ${error.message || "Unknown viewer error"}`,
        );
      });

      // Add edit mode click handler
      if (isEditMode && isAddingHotspot) {
        viewer.on("mousedown", (event: any) => {
          if (event.type === "mousedown") {
            const coords = viewer.mouseEventToCoords(event);
            setPendingHotspot({ pitch: coords[0], yaw: coords[1] });
            setShowHotspotDialog(true);
            setIsAddingHotspot(false);
          }
        });
      }

      setPannellumViewer(viewer);
    } catch (error) {
      console.error("❌ Failed to create Pannellum viewer:", error);
      throw error;
    }
  };

  const testImageAccessibility = async (imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const testImage = new Image();
      testImage.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        reject(new Error("Image loading timeout after 10 seconds"));
      }, 10000);

      testImage.onload = () => {
        clearTimeout(timeout);
        console.log("✅ 360° image accessibility confirmed:", imageUrl);
        resolve();
      };

      testImage.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load 360° image: ${imageUrl}`));
      };

      testImage.src = imageUrl;
    });
  };

  const prepareHotspots = (sceneData: TourScene) => {
    const hotspots =
      sceneData.hotspots?.map((hotspot, index) => ({
        pitch: hotspot.pitch,
        yaw: hotspot.yaw,
        type: hotspot.type,
        text: hotspot.text,
        id: `hotspot-${index}`,
        clickHandlerFunc: hotspot.sceneId
          ? () => {
              const targetSceneIndex = scenes.findIndex(
                (s) => s.id === hotspot.sceneId,
              );
              if (targetSceneIndex !== -1) {
                console.log(
                  "🎯 Navigating to scene:",
                  scenes[targetSceneIndex].title,
                );
                setCurrentScene(targetSceneIndex);
              }
            }
          : undefined,
        cssClass:
          hotspot.type === "scene" ? "hotspot-navigation" : "hotspot-info",
        scale: true,
      })) || [];

    // Add default hotspots if none exist
    if (hotspots.length === 0) {
      hotspots.push(
        {
          pitch: -10,
          yaw: 90,
          type: "info",
          text: "🌊 Bodensee-Blick",
          id: "lake-view",
          cssClass: "hotspot-info",
          scale: true,
          clickHandlerFunc: () => {
            console.log("ℹ️ Hotspot clicked: Bodensee-Blick");
          },
        },
        {
          pitch: -5,
          yaw: -45,
          type: "info",
          text: "🏡 Wohnbereich",
          id: "living-area",
          cssClass: "hotspot-info",
          scale: true,
          clickHandlerFunc: () => {
            console.log("ℹ️ Hotspot clicked: Wohnbereich");
          },
        },
      );
    }

    return hotspots;
  };

  const isMobileDevice = (): boolean => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  };

  const showErrorFallback = () => {
    if (!viewerRef.current) return;

    const errorContainer = document.createElement("div");
    errorContainer.className =
      "flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8";

    const icon = document.createElement("div");
    icon.className = "text-red-500 mb-4 text-4xl";
    icon.textContent = "🎬";

    const title = document.createElement("h3");
    title.className = "text-xl font-bold text-gray-800 mb-2";
    title.textContent = "360° Tour nicht verfügbar";

    const message = document.createElement("p");
    message.className = "text-center text-gray-600 mb-4 max-w-md";
    message.textContent =
      "Die 360° Tour konnte nicht geladen werden. Dies kann an fehlenden Bildern oder Netzwerkproblemen liegen.";

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex flex-col sm:flex-row gap-3";

    const reloadBtn = document.createElement("button");
    reloadBtn.className =
      "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium";
    reloadBtn.textContent = "🔄 Neu laden";
    reloadBtn.addEventListener("click", () => {
      setRetryCount(0);
      window.location.reload();
    });

    const hideBtn = document.createElement("button");
    hideBtn.className =
      "px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium";
    hideBtn.textContent = "Tour ausblenden";
    hideBtn.addEventListener("click", () => {
      const tourCard = viewerRef.current?.closest(".tour-card");
      if (tourCard) {
        (tourCard as HTMLElement).style.display = "none";
      }
    });

    buttonContainer.appendChild(reloadBtn);
    buttonContainer.appendChild(hideBtn);

    errorContainer.appendChild(icon);
    errorContainer.appendChild(title);
    errorContainer.appendChild(message);
    errorContainer.appendChild(buttonContainer);

    viewerRef.current.innerHTML = "";
    viewerRef.current.appendChild(errorContainer);
  };

  // Auto-rotate control
  useEffect(() => {
    if (
      pannellumViewer &&
      typeof pannellumViewer.setAutoRotate === "function"
    ) {
      pannellumViewer.setAutoRotate(isPlaying ? -2 : 0);
    }
  }, [isPlaying, pannellumViewer]);

  const handleAddHotspot = () => {
    if (!pendingHotspot || !targetSceneId) return;

    const targetScene = scenes.find((s) => s.id === targetSceneId);
    if (!targetScene) return;

    const newHotspot: TourHotspot = {
      pitch: pendingHotspot.pitch,
      yaw: pendingHotspot.yaw,
      text: `Zur ${targetScene.title}`,
      sceneId: targetSceneId,
      type: "scene",
    };

    if (onHotspotAdded) {
      onHotspotAdded(scenes[currentScene].id, newHotspot);
    }

    setShowHotspotDialog(false);
    setPendingHotspot(null);
    setTargetSceneId("");
  };

  const handleSceneChange = (sceneIndex: number) => {
    if (sceneIndex < 0 || sceneIndex >= scenes.length) return;

    console.log("🎯 Changing scene to:", scenes[sceneIndex].title);
    setCurrentScene(sceneIndex);
  };

  const toggleAutoRotate = () => {
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    if (pannellumViewer && typeof pannellumViewer.setPitch === "function") {
      try {
        pannellumViewer.setPitch(0);
        pannellumViewer.setYaw(0);
        pannellumViewer.setHfov(100);
        console.log("🔄 View reset to default position");
      } catch (error) {
        console.warn("⚠️ Error resetting view:", error);
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
        console.log("🖥️ Toggled fullscreen mode");
      } catch (error) {
        console.warn("⚠️ Error toggling fullscreen:", error);
      }
    }
  };

  if (scenes.length === 0) {
    return (
      <Card className="w-full tour-card">
        <CardContent className="p-8 text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">360° Tour</h3>
          <p className="text-gray-600 mb-4">Keine 360° Bilder verfügbar</p>
          <p className="text-sm text-gray-500">
            Laden Sie 360° Bilder im Admin-Bereich hoch, um interaktive Touren
            zu erstellen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full tour-card">
      <CardContent className="p-0">
        <div className="relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-t-lg">
              <div className="text-center text-white">
                <div className="animate-spin text-4xl mb-4">🎬</div>
                <p className="text-lg font-medium">360° Tour wird geladen...</p>
                <p className="text-sm opacity-75 mt-1">
                  {retryCount > 0
                    ? `Versuch ${retryCount + 1}/4`
                    : "Bitte warten"}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="w-full h-96 md:h-[500px] flex items-center justify-center bg-gray-100 rounded-t-lg">
              <div className="text-center p-8">
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  360° Tour Fehler
                </h3>
                <p className="text-gray-600 mb-4 max-w-md">{error}</p>
                <Button
                  onClick={() => {
                    setError(null);
                    setRetryCount(0);
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🔄 Erneut versuchen
                </Button>
              </div>
            </div>
          )}

          {/* Main Viewer */}
          <div
            ref={viewerRef}
            className="w-full h-96 md:h-[500px] rounded-t-lg overflow-hidden bg-black"
            style={{
              minHeight: "400px",
              maxHeight: "70vh",
              touchAction: "pan-x pan-y",
            }}
          />

          {/* Enhanced Controls Overlay */}
          {!isLoading && !error && (
            <>
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="bg-gradient-to-r from-blue-600/90 to-blue-800/90 text-white px-4 py-3 rounded-lg backdrop-blur-sm border border-white/20 max-w-xs sm:max-w-md">
                  <h4 className="font-bold text-base sm:text-lg truncate">
                    {propertyTitle}
                  </h4>
                  <p className="text-sm opacity-95 flex items-center truncate">
                    🌊 {scenes[currentScene]?.title || "Unbekannter Raum"}
                  </p>
                  {isEditMode && (
                    <p className="text-xs text-yellow-200 mt-1 flex items-center">
                      ✏️ Admin-Modus aktiv
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsAddingHotspot(!isAddingHotspot)}
                      className={`${isAddingHotspot ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                    >
                      {isAddingHotspot ? (
                        <Edit className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  )}
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
                </div>
              </div>

              {/* Enhanced Scene Navigation */}
              {scenes.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/80 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {scenes.map((scene, index) => (
                        <Button
                          key={scene.id}
                          size="sm"
                          variant={
                            index === currentScene ? "default" : "secondary"
                          }
                          onClick={() => handleSceneChange(index)}
                          className={`whitespace-nowrap min-w-fit ${
                            index === currentScene
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {scene.title.length > 15
                              ? scene.title.substring(0, 15) + "..."
                              : scene.title}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hotspot Creation Dialog */}
        <Dialog open={showHotspotDialog} onOpenChange={setShowHotspotDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hotspot hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Zielraum auswählen:
                </label>
                <Select value={targetSceneId} onValueChange={setTargetSceneId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Raum auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scenes
                      .filter((scene) => scene.id !== scenes[currentScene]?.id)
                      .map((scene) => (
                        <SelectItem key={scene.id} value={scene.id}>
                          {scene.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowHotspotDialog(false);
                    setPendingHotspot(null);
                    setTargetSceneId("");
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleAddHotspot}
                  disabled={!targetSceneId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Hotspot hinzufügen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Mode Instructions */}
        {isEditMode && isAddingHotspot && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm z-40 border border-yellow-300">
            💡 Klicken Sie in das 360°-Bild, um einen Hotspot zu platzieren
          </div>
        )}

        {/* Mobile Touch Instructions */}
        {isMobileDevice() && !isLoading && !error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs z-30 border border-blue-300">
            📱 Berühren & Ziehen zum Bewegen • Pinch zum Zoomen
          </div>
        )}
      </CardContent>
    </Card>
  );
}
