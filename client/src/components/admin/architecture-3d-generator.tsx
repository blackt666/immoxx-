import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Box, Download, Play, FileImage, Building, Camera, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlueprintData {
  id: string;
  name: string;
  image: string;
  analyzed: boolean;
  walls: any[];
  rooms: any[];
  doors: any[];
  windows: any[];
  generated3D: boolean;
}

interface AnalysisParams {
  wallHeight: number;
  wallThickness: number;
  generateDoors: boolean;
  generateWindows: boolean;
  generateRoof: boolean;
}

export default function Architecture3DGenerator() {
  const [currentBlueprint, setCurrentBlueprint] = useState<BlueprintData | null>(null);
  const [analysisParams, setAnalysisParams] = useState<AnalysisParams>({
    wallHeight: 2.5,
    wallThickness: 0.15,
    generateDoors: true,
    generateWindows: true,
    generateRoof: false
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBlueprintUpload = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      // Simulate analysis progress
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Create mock analysis results
      const blueprintData: BlueprintData = {
        id: Date.now().toString(),
        name: file.name,
        image: imageUrl,
        analyzed: true,
        walls: [
          { id: '1', start: [0, 0], end: [10, 0], thickness: analysisParams.wallThickness },
          { id: '2', start: [10, 0], end: [10, 8], thickness: analysisParams.wallThickness },
          { id: '3', start: [10, 8], end: [0, 8], thickness: analysisParams.wallThickness },
          { id: '4', start: [0, 8], end: [0, 0], thickness: analysisParams.wallThickness }
        ],
        rooms: [
          { id: '1', name: 'Wohnzimmer', area: 80, center: [5, 4] }
        ],
        doors: analysisParams.generateDoors ? [
          { id: '1', position: [5, 0], width: 0.8, wallId: '1' }
        ] : [],
        windows: analysisParams.generateWindows ? [
          { id: '1', position: [2, 8], width: 1.2, wallId: '3' },
          { id: '2', position: [8, 8], width: 1.2, wallId: '3' }
        ] : [],
        generated3D: false
      };
      
      setCurrentBlueprint(blueprintData);
      setIsAnalyzing(false);
      setActiveTab('analysis');
      
      toast({
        title: "Bauplan erfolgreich hochgeladen",
        description: "Die Analyse wurde abgeschlossen.",
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleGenerate3D = async () => {
    if (!currentBlueprint) return;
    
    setIsGenerating(true);
    
    // Simulate 3D generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentBlueprint(prev => prev ? { ...prev, generated3D: true } : null);
    setIsGenerating(false);
    setActiveTab('3d-view');
    
    toast({
      title: "3D-Modell generiert",
      description: "Ihr 3D-Architekturmodell wurde erfolgreich erstellt.",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 16 * 1024 * 1024; // 16MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte laden Sie eine PNG- oder JPEG-Bilddatei hoch",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: "Dateigröße muss unter 16MB liegen",
          variant: "destructive",
        });
        return;
      }

      handleBlueprintUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-[#566B73]" />
            3D Architektur Generator
          </h2>
          <p className="text-gray-600 mt-1">Wandeln Sie Baupläne in interaktive 3D-Modelle um</p>
        </div>
        
        {currentBlueprint?.generated3D && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('3d-view')}
            >
              <Camera className="h-4 w-4 mr-2" />
              Virtuelle Tour
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveTab('export')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Hochladen
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!currentBlueprint}>
            <FileImage className="h-4 w-4 mr-2" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="3d-view" disabled={!currentBlueprint?.generated3D}>
            <Box className="h-4 w-4 mr-2" />
            3D Ansicht
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!currentBlueprint?.generated3D}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Bauplan hochladen
                  </CardTitle>
                  <CardDescription>
                    Laden Sie einen Bauplan als Bild (PNG, JPEG) hoch, um ein 3D-Modell zu generieren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#566B73] mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">Bauplan wird analysiert...</p>
                        </div>
                      </div>
                      <Progress value={analysisProgress} />
                      <p className="text-xs text-center text-muted-foreground">
                        {analysisProgress}% abgeschlossen
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#566B73] transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Klicken Sie hier oder ziehen Sie eine Datei hierher
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPEG bis zu 16MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analyse-Einstellungen</CardTitle>
                  <CardDescription className="text-xs">
                    Parameter für die 3D-Modellgenerierung
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wandhöhe</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="2"
                        max="4"
                        step="0.1"
                        value={analysisParams.wallHeight}
                        onChange={(e) => setAnalysisParams({ ...analysisParams, wallHeight: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                      <Badge variant="outline">{analysisParams.wallHeight}m</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wandstärke</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="0.3"
                        step="0.01"
                        value={analysisParams.wallThickness}
                        onChange={(e) => setAnalysisParams({ ...analysisParams, wallThickness: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                      <Badge variant="outline">{analysisParams.wallThickness}m</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium">Türen generieren</span>
                      <input
                        type="checkbox"
                        checked={analysisParams.generateDoors}
                        onChange={(e) => setAnalysisParams({ ...analysisParams, generateDoors: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium">Fenster generieren</span>
                      <input
                        type="checkbox"
                        checked={analysisParams.generateWindows}
                        onChange={(e) => setAnalysisParams({ ...analysisParams, generateWindows: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium">Dach generieren</span>
                      <input
                        type="checkbox"
                        checked={analysisParams.generateRoof}
                        onChange={(e) => setAnalysisParams({ ...analysisParams, generateRoof: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {currentBlueprint && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bauplan-Vorschau</CardTitle>
                  <CardDescription>{currentBlueprint.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <img 
                    src={currentBlueprint.image} 
                    alt="Bauplan" 
                    className="w-full h-auto rounded-lg border"
                  />
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse-Ergebnisse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Wände erkannt</span>
                      <Badge>{currentBlueprint.walls.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Räume erkannt</span>
                      <Badge>{currentBlueprint.rooms.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Türen</span>
                      <Badge>{currentBlueprint.doors.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Fenster</span>
                      <Badge>{currentBlueprint.windows.length}</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Button
                  onClick={handleGenerate3D}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      3D-Modell wird generiert...
                    </>
                  ) : (
                    <>
                      <Box className="h-4 w-4 mr-2" />
                      3D-Modell generieren
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="3d-view" className="space-y-6">
          {currentBlueprint?.generated3D && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  3D-Modell Ansicht
                </CardTitle>
                <CardDescription>
                  Interaktives 3D-Modell Ihres Bauplans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 text-center min-h-[400px] flex items-center justify-center">
                  <div className="space-y-4">
                    <div className="w-24 h-24 bg-[#566B73]/20 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                      <Box className="h-12 w-12 text-[#566B73] animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2">3D-Modell erfolgreich generiert</h3>
                      <p className="text-muted-foreground mb-4">
                        Ihr Bauplan wurde in ein detailliertes 3D-Architekturmodell umgewandelt
                      </p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>🔄 <strong>Rotation:</strong> Linke Maustaste + Ziehen</p>
                        <p>🔍 <strong>Zoom:</strong> Mausrad oder Pinch-Geste</p>
                        <p>↔️ <strong>Pan:</strong> Rechte Maustaste + Ziehen</p>
                      </div>
                    </div>
                    <Button size="lg" className="mt-4">
                      <Play className="h-4 w-4 mr-2" />
                      Virtuelle Tour starten
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          {currentBlueprint?.generated3D && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  3D-Modell exportieren
                </CardTitle>
                <CardDescription>
                  Exportieren Sie Ihr 3D-Modell in verschiedenen Formaten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <FileImage className="h-6 w-6" />
                    <span>JPG Export</span>
                    <span className="text-xs text-muted-foreground">Bildformat</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>OBJ Export</span>
                    <span className="text-xs text-muted-foreground">3D-Format</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2">
                    <Download className="h-6 w-6" />
                    <span>GLB Export</span>
                    <span className="text-xs text-muted-foreground">3D-Format</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
