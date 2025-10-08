import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, Cube, Download, Play, FileImage, Building, Camera, TestTube } from '@phosphor-icons/react'
import { BlueprintUpload } from '@/components/blueprint/BlueprintUpload'
import { AnalysisSettings } from '@/components/blueprint/AnalysisSettings'
import { ModelViewer } from '@/components/3d/ModelViewer'
import { ExportPanel } from '@/components/export/ExportPanel'
import { E2ETest } from '@/components/testing/E2ETest'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

export interface BlueprintData {
  id: string
  name: string
  image: string
  analyzed: boolean
  walls: any[]
  rooms: any[]
  doors: any[]
  windows: any[]
  generated3D: boolean
}

export interface AnalysisParams {
  wallHeight: number
  wallThickness: number
  generateDoors: boolean
  generateWindows: boolean
  generateRoof: boolean
}

function App() {
  const [currentBlueprint, setCurrentBlueprint] = useKV<BlueprintData | null>('current-blueprint', null)
  const [analysisParams, setAnalysisParams] = useKV<AnalysisParams>('analysis-params', {
    wallHeight: 2.5,
    wallThickness: 0.15,
    generateDoors: true,
    generateWindows: true,
    generateRoof: false
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('upload')
  const modelViewerRef = useRef<{ startTour: () => void }>(null)

  const handleBlueprintUpload = async (file: File) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // Simulate blueprint analysis
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string
      
      // Simulate analysis progress
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Create mock analysis results
      const blueprintData: BlueprintData = {
        id: Date.now().toString(),
        name: file.name,
        image: imageUrl,
        analyzed: true,
        walls: [
          { id: '1', start: [0, 0], end: [10, 0], thickness: analysisParams?.wallThickness || 0.15 },
          { id: '2', start: [10, 0], end: [10, 8], thickness: analysisParams?.wallThickness || 0.15 },
          { id: '3', start: [10, 8], end: [0, 8], thickness: analysisParams?.wallThickness || 0.15 },
          { id: '4', start: [0, 8], end: [0, 0], thickness: analysisParams?.wallThickness || 0.15 }
        ],
        rooms: [
          { id: '1', name: 'Wohnzimmer', area: 80, center: [5, 4] }
        ],
        doors: analysisParams?.generateDoors ? [
          { id: '1', position: [5, 0], width: 0.8, wallId: '1' }
        ] : [],
        windows: analysisParams?.generateWindows ? [
          { id: '1', position: [2, 8], width: 1.2, wallId: '3' },
          { id: '2', position: [8, 8], width: 1.2, wallId: '3' }
        ] : [],
        generated3D: false
      }
      
      setCurrentBlueprint(blueprintData)
      setIsAnalyzing(false)
      setActiveTab('analysis')
    }
    
    reader.readAsDataURL(file)
  }

  const handleGenerate3D = async () => {
    if (!currentBlueprint) return
    
    setIsGenerating(true)
    
    // Simulate 3D generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setCurrentBlueprint(prev => prev ? { ...prev, generated3D: true } : null)
    setIsGenerating(false)
    setActiveTab('3d-view')
  }

  const handleStartTour = () => {
    if (!currentBlueprint?.generated3D) {
      toast.error('Bitte generieren Sie zuerst ein 3D-Modell!')
      return
    }
    
    // Wechsle zur 3D-Ansicht und starte die Tour
    setActiveTab('3d-view')
    
    // Kurze Verzögerung um sicherzustellen, dass die Komponente gerendert ist
    setTimeout(() => {
      toast.success('Virtuelle Tour wird gestartet...')
      // Hier würde normalerweise die Tour-Funktion des ModelViewers aufgerufen
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <Building className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">3D Architektur Generator</h1>
                <p className="text-sm text-muted-foreground">Wandeln Sie Baupläne in interaktive 3D-Modelle um</p>
              </div>
            </div>
            
            {currentBlueprint?.generated3D && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartTour}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Virtuelle Tour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Quick JPG export
                    setActiveTab('export')
                    setTimeout(() => {
                      const jpgButton = document.querySelector('[data-export-format="jpg"]') as HTMLButtonElement
                      if (jpgButton) {
                        jpgButton.click()
                      }
                    }, 100)
                  }}
                  className="gap-2"
                >
                  <FileImage className="h-4 w-4" />
                  JPG Export
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveTab('export')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportieren
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('test')}
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              E2E Test ausführen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Hochladen
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              disabled={!currentBlueprint}
              className="gap-2"
            >
              <FileImage className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger 
              value="3d-view" 
              disabled={!currentBlueprint?.generated3D}
              className="gap-2"
            >
              <Cube className="h-4 w-4" />
              3D Ansicht
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              disabled={!currentBlueprint?.generated3D}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <TestTube className="h-4 w-4" />
              E2E Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BlueprintUpload 
                  onUpload={handleBlueprintUpload}
                  isAnalyzing={isAnalyzing}
                  progress={analysisProgress}
                />
              </div>
              <div>
                <AnalysisSettings 
                  params={analysisParams || {
                    wallHeight: 2.5,
                    wallThickness: 0.15,
                    generateDoors: true,
                    generateWindows: true,
                    generateRoof: false
                  }}
                  onChange={setAnalysisParams}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {currentBlueprint && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        Bauplan-Analyse
                      </CardTitle>
                      <CardDescription>
                        Überprüfen Sie erkannte Elemente und generieren Sie ein 3D-Modell
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={currentBlueprint.image} 
                          alt="Blueprint"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-lg">{currentBlueprint.walls.length}</div>
                            <div className="text-muted-foreground">Wände</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-lg">{currentBlueprint.rooms.length}</div>
                            <div className="text-muted-foreground">Räume</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-lg">{currentBlueprint.doors.length}</div>
                            <div className="text-muted-foreground">Türen</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-lg">{currentBlueprint.windows.length}</div>
                            <div className="text-muted-foreground">Fenster</div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleGenerate3D}
                          disabled={isGenerating}
                          className="gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                              Generiere...
                            </>
                          ) : (
                            <>
                              <Cube className="h-4 w-4" />
                              3D-Modell generieren
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <AnalysisSettings 
                    params={analysisParams || {
                      wallHeight: 2.5,
                      wallThickness: 0.15,
                      generateDoors: true,
                      generateWindows: true,
                      generateRoof: false
                    }}
                    onChange={setAnalysisParams}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="3d-view" className="space-y-6">
            {currentBlueprint?.generated3D && (
              <ModelViewer blueprint={currentBlueprint} />
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {currentBlueprint?.generated3D && (
              <ExportPanel blueprint={currentBlueprint} />
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <E2ETest onTestComplete={(results) => {
              console.log('E2E Test Results:', results)
            }} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App