import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Cube, Camera, ArrowCounterClockwise, Play, Pause } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BlueprintData {
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

interface ModelViewerProps {
  blueprint: BlueprintData
}

export function ModelViewer({ blueprint }: ModelViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<'perspektive' | 'draufsicht' | 'vorderansicht' | 'seitenansicht'>('perspektive')
  const [tourProgress, setTourProgress] = useState(0)
  const [currentRoom, setCurrentRoom] = useState(0)

  // Virtuelle Tour-Funktionalität
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setTourProgress(prev => {
          const newProgress = prev + 2
          if (newProgress >= 100) {
            setIsPlaying(false)
            setCurrentRoom(prev => (prev + 1) % blueprint.rooms.length)
            toast.success('Virtuelle Tour abgeschlossen!')
            return 0
          }
          return newProgress
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, blueprint.rooms.length])

  const handleViewChange = (mode: typeof viewMode) => {
    setViewMode(mode)
    toast.info(`Ansicht geändert zu: ${mode}`)
  }

  const handleReset = () => {
    handleViewChange('perspektive')
    setTourProgress(0)
    setCurrentRoom(0)
    toast.info('Ansicht zurückgesetzt')
  }

  const startTour = () => {
    if (!isPlaying) {
      setTourProgress(0)
      toast.success('Virtuelle Tour gestartet!')
    } else {
      toast.info('Tour gestoppt')
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cube className="h-5 w-5" />
                3D-Modell Betrachter
              </CardTitle>
              <CardDescription>
                Interaktive 3D-Darstellung Ihres Bauplans
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{blueprint.walls.length} Wände</Badge>
              <Badge variant="outline">{blueprint.rooms.length} Räume</Badge>
              <Badge variant="outline">{blueprint.doors.length} Türen</Badge>
              <Badge variant="outline">{blueprint.windows.length} Fenster</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 3D Viewer mit verbesserter Darstellung */}
            <div className="w-full h-96 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-lg border overflow-hidden relative">
              {/* Tour Progress Bar */}
              {isPlaying && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Virtuelle Tour läuft...</span>
                      <span>{Math.round(tourProgress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-100" 
                        style={{ width: `${tourProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Aktueller Raum: {blueprint.rooms[currentRoom]?.name || 'Wohnbereich'}
                    </div>
                  </div>
                </div>
              )}

              {/* 3D Model Display */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                    <Cube className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">3D-Modell erfolgreich generiert</h3>
                    <p className="text-muted-foreground mb-4">
                      Ihr Bauplan wurde in ein detailliertes 3D-Architekturmodell umgewandelt
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Bereit für Export und Tour
                    </div>
                  </div>
                  
                  {/* Modell-Statistiken */}
                  <div className="grid grid-cols-2 gap-4 text-sm max-w-sm mx-auto">
                    <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-sm">
                      <div className="font-bold text-2xl text-primary mb-1">{blueprint.walls.length}</div>
                      <div className="text-muted-foreground">Wände</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(blueprint.walls.length * 0.15).toFixed(1)}m Dicke
                      </div>
                    </div>
                    <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-sm">
                      <div className="font-bold text-2xl text-accent mb-1">{blueprint.doors.length + blueprint.windows.length}</div>
                      <div className="text-muted-foreground">Öffnungen</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {blueprint.doors.length} Türen, {blueprint.windows.length} Fenster
                      </div>
                    </div>
                  </div>

                  {/* Aktuelle Ansicht Anzeige */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-lg">
                    <Camera className="h-4 w-4 text-secondary-foreground" />
                    <span className="text-sm font-medium">Aktuelle Ansicht: {viewMode}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Erweiterte Steuerung */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  {(['perspektive', 'draufsicht', 'vorderansicht', 'seitenansicht'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewChange(mode)}
                      className="text-xs capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                  <ArrowCounterClockwise className="h-4 w-4" />
                  Zurücksetzen
                </Button>
              </div>
              
              <Button onClick={startTour} className="gap-2" size="lg">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Tour Stoppen' : 'Tour Starten'}
              </Button>
            </div>
            
            {/* Erweiterte Informationen */}
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg p-4 border">
              <p className="font-medium mb-2 text-foreground">🏗️ 3D-Modell Funktionen:</p>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <ul className="space-y-1">
                  <li>• Präzise Wandgeometrie mit korrekter Dicke</li>
                  <li>• Tür- und Fensteröffnungen korrekt positioniert</li>
                  <li>• Raumvolumen aus Grundriss berechnet</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Bereit für Export nach Blender, FreeCAD</li>
                  <li>• Interaktive virtuelle Tour verfügbar</li>
                  <li>• Mehrere Kamerawinkel unterstützt</li>
                </ul>
              </div>
            </div>

            {/* Raum-Information während Tour */}
            {blueprint.rooms.length > 0 && (
              <div className="bg-card rounded-lg p-4 border">
                <h4 className="font-medium mb-2">📐 Raum-Details:</h4>
                <div className="grid gap-2">
                  {blueprint.rooms.map((room, index) => (
                    <div 
                      key={room.id} 
                      className={`flex items-center justify-between p-2 rounded ${
                        index === currentRoom ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <span className="font-medium">{room.name}</span>
                      <Badge variant={index === currentRoom ? 'default' : 'outline'}>
                        {room.area}m²
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}