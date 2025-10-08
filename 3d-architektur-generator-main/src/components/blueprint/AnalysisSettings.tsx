import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Gear, Ruler, Door, Browsers, House } from '@phosphor-icons/react'

interface AnalysisParams {
  wallHeight: number
  wallThickness: number
  generateDoors: boolean
  generateWindows: boolean
  generateRoof: boolean
}

interface AnalysisSettingsProps {
  params: AnalysisParams
  onChange: (params: AnalysisParams) => void
}

export function AnalysisSettings({ params, onChange }: AnalysisSettingsProps) {
  const updateParam = <K extends keyof AnalysisParams>(key: K, value: AnalysisParams[K]) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gear className="h-5 w-5" />
          Analyse-Einstellungen
        </CardTitle>
        <CardDescription>
          Parameter für die 3D-Modellgenerierung konfigurieren
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wall Dimensions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Wandabmessungen</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="wall-height">Wandhöhe</Label>
                <Badge variant="outline">{params.wallHeight}m</Badge>
              </div>
              <Slider
                id="wall-height"
                min={2.0}
                max={4.0}
                step={0.1}
                value={[params.wallHeight]}
                onValueChange={([value]) => updateParam('wallHeight', value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>2.0m</span>
                <span>4.0m</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="wall-thickness">Wandstärke</Label>
                <Badge variant="outline">{params.wallThickness}m</Badge>
              </div>
              <Slider
                id="wall-thickness"
                min={0.1}
                max={0.3}
                step={0.01}
                value={[params.wallThickness]}
                onValueChange={([value]) => updateParam('wallThickness', value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.1m</span>
                <span>0.3m</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Generation Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Generierungsoptionen</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Door className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="generate-doors" className="text-sm font-medium">
                    Türen generieren
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Türöffnungen automatisch erkennen und erstellen
                  </p>
                </div>
              </div>
              <Switch
                id="generate-doors"
                checked={params.generateDoors}
                onCheckedChange={(checked) => updateParam('generateDoors', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Browsers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="generate-windows" className="text-sm font-medium">
                    Fenster generieren
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Fensteröffnungen automatisch erkennen und erstellen
                  </p>
                </div>
              </div>
              <Switch
                id="generate-windows"
                checked={params.generateWindows}
                onCheckedChange={(checked) => updateParam('generateWindows', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <House className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="generate-roof" className="text-sm font-medium">
                    Dach generieren
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Grundlegende Dachstruktur zum Modell hinzufügen
                  </p>
                </div>
              </div>
              <Switch
                id="generate-roof"
                checked={params.generateRoof}
                onCheckedChange={(checked) => updateParam('generateRoof', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Quality Presets */}
        <div className="space-y-3">
          <h4 className="font-medium">Qualitäts-Voreinstellungen</h4>
          <div className="grid grid-cols-1 gap-2">
            {[
              { 
                name: 'Einfach', 
                desc: 'Nur Wände',
                config: { wallHeight: 2.5, wallThickness: 0.15, generateDoors: false, generateWindows: false, generateRoof: false }
              },
              { 
                name: 'Standard', 
                desc: 'Wände, Türen & Fenster',
                config: { wallHeight: 2.5, wallThickness: 0.15, generateDoors: true, generateWindows: true, generateRoof: false }
              },
              { 
                name: 'Vollständig', 
                desc: 'Komplettes Gebäude mit Dach',
                config: { wallHeight: 2.7, wallThickness: 0.18, generateDoors: true, generateWindows: true, generateRoof: true }
              }
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange(preset.config)}
                className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors text-sm"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-muted-foreground text-xs">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}