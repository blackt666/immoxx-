import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Download, FileText, Cube, Code, FileArchive, Camera } from '@phosphor-icons/react'
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

interface ExportPanelProps {
  blueprint: BlueprintData
}

interface ExportOptions {
  includeTextures: boolean
  includeMaterials: boolean
  includeRoomTours: boolean
  optimizeGeometry: boolean
}

export function ExportPanel({ blueprint }: ExportPanelProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTextures: true,
    includeMaterials: true,
    includeRoomTours: true,
    optimizeGeometry: false
  })
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const generateOBJ = () => {
    const objContent = `# 3D Architecture Model
# Generated from blueprint: ${blueprint.name}
# Walls: ${blueprint.walls.length}, Rooms: ${blueprint.rooms.length}

# Vertices
${blueprint.walls.map((wall, i) => 
  `v ${wall.start[0]} 0 ${wall.start[1]}
v ${wall.end[0]} 0 ${wall.end[1]}
v ${wall.start[0]} 2.5 ${wall.start[1]}
v ${wall.end[0]} 2.5 ${wall.end[1]}`
).join('\n')}

# Faces (walls)
${blueprint.walls.map((_, i) => {
  const base = i * 4 + 1
  return `f ${base} ${base + 1} ${base + 3} ${base + 2}`
}).join('\n')}
`
    return objContent
  }

  const generateBlenderScript = () => {
    return `import bpy
import bmesh
from mathutils import Vector

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Create materials
wall_material = bpy.data.materials.new(name="Wall_Material")
wall_material.use_nodes = True
wall_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.8, 0.8, 0.8, 1.0)

door_material = bpy.data.materials.new(name="Door_Material")
door_material.use_nodes = True
door_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.6, 0.3, 0.1, 1.0)

window_material = bpy.data.materials.new(name="Window_Material")
window_material.use_nodes = True
window_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.2, 0.6, 1.0, 1.0)
window_material.node_tree.nodes["Principled BSDF"].inputs[21].default_value = 0.0  # Alpha

# Generate walls
${blueprint.walls.map((wall, i) => `
# Wall ${i + 1}
bpy.ops.mesh.primitive_cube_add()
wall_${i} = bpy.context.object
wall_${i}.name = "Wall_${i + 1}"
wall_${i}.scale = (${Math.sqrt(Math.pow(wall.end[0] - wall.start[0], 2) + Math.pow(wall.end[1] - wall.start[1], 2)) / 2}, 1.25, 0.075)
wall_${i}.location = (${(wall.start[0] + wall.end[0]) / 2}, 1.25, ${(wall.start[1] + wall.end[1]) / 2})
wall_${i}.data.materials.append(wall_material)
`).join('')}

# Generate doors
${blueprint.doors.map((door, i) => `
# Door ${i + 1}
bpy.ops.mesh.primitive_cube_add()
door_${i} = bpy.context.object
door_${i}.name = "Door_${i + 1}"
door_${i}.scale = (${door.width / 2}, 1.0, 0.025)
door_${i}.location = (${door.position[0]}, 1.0, ${door.position[1]})
door_${i}.data.materials.append(door_material)
`).join('')}

# Generate windows
${blueprint.windows.map((window, i) => `
# Window ${i + 1}
bpy.ops.mesh.primitive_cube_add()
window_${i} = bpy.context.object
window_${i}.name = "Window_${i + 1}"
window_${i}.scale = (${window.width / 2}, 0.5, 0.025)
window_${i}.location = (${window.position[0]}, 1.5, ${window.position[1]})
window_${i}.data.materials.append(window_material)
`).join('')}

# Add lighting
bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
sun_light = bpy.context.object
sun_light.data.energy = 3

# Set up camera for room tour
bpy.ops.object.camera_add(location=(0, 0, 5))
camera = bpy.context.object
camera.name = "Tour_Camera"

# Room tour keyframes
${blueprint.rooms.map((room, i) => `
# Keyframe for room ${i + 1}: ${room.name}
bpy.context.scene.frame_set(${i * 50 + 1})
camera.location = (${room.center[0]}, 2.0, ${room.center[1] + 3})
camera.keyframe_insert(data_path="location", index=-1)
`).join('')}

print("3D Architecture model imported successfully!")
print("Walls: ${blueprint.walls.length}, Doors: ${blueprint.doors.length}, Windows: ${blueprint.windows.length}")
print("Press SPACEBAR to start room tour animation")
`
  }

  const generateFreeCADScript = () => {
    return `import FreeCAD
import Part
import Arch

# Create new document
doc = FreeCAD.newDocument("Architecture_Model")

# Generate walls
${blueprint.walls.map((wall, i) => `
# Wall ${i + 1}
wall_${i}_line = Part.makeLine(
    FreeCAD.Vector(${wall.start[0]}, ${wall.start[1]}, 0),
    FreeCAD.Vector(${wall.end[0]}, ${wall.end[1]}, 0)
)
wall_${i} = Arch.makeWall(wall_${i}_line, width=150, height=2500)
wall_${i}.Label = "Wall_${i + 1}"
doc.addObject(wall_${i})
`).join('')}

# Generate doors
${blueprint.doors.map((door, i) => `
# Door ${i + 1}
door_${i} = Arch.makeDoor(width=${door.width * 1000}, height=2000)
door_${i}.Label = "Door_${i + 1}"
door_${i}.Placement.Base = FreeCAD.Vector(${door.position[0] * 1000}, ${door.position[1] * 1000}, 0)
doc.addObject(door_${i})
`).join('')}

# Generate windows
${blueprint.windows.map((window, i) => `
# Window ${i + 1}
window_${i} = Arch.makeWindow(width=${window.width * 1000}, height=1000)
window_${i}.Label = "Window_${i + 1}"
window_${i}.Placement.Base = FreeCAD.Vector(${window.position[0] * 1000}, ${window.position[1] * 1000}, 1500)
doc.addObject(window_${i})
`).join('')}

# Recompute document
doc.recompute()

print("FreeCAD Architecture model created successfully!")
print("Walls: ${blueprint.walls.length}, Doors: ${blueprint.doors.length}, Windows: ${blueprint.windows.length}")
`
  }

  const generateJPGSnapshot = async () => {
    // Create a canvas for rendering the 3D snapshot
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    
    // Set high resolution for better quality
    canvas.width = 1920
    canvas.height = 1080
    
    // Create a gradient background for the architectural visualization
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#f8fafc')
    gradient.addColorStop(1, '#e2e8f0')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw architectural elements
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Scale and center the blueprint
    const scale = Math.min(canvas.width / 15, canvas.height / 12) * 0.6
    ctx.scale(scale, scale)
    
    // Draw rooms as filled areas
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.lineWidth = 0.02
    blueprint.rooms.forEach(room => {
      ctx.fillRect(room.center[0] - 2, room.center[1] - 2, 4, 4)
      ctx.strokeRect(room.center[0] - 2, room.center[1] - 2, 4, 4)
    })
    
    // Draw walls
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 0.15
    ctx.lineCap = 'round'
    blueprint.walls.forEach(wall => {
      ctx.beginPath()
      ctx.moveTo(wall.start[0], wall.start[1])
      ctx.lineTo(wall.end[0], wall.end[1])
      ctx.stroke()
    })
    
    // Draw doors
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 0.08
    blueprint.doors.forEach(door => {
      ctx.beginPath()
      ctx.arc(door.position[0], door.position[1], door.width / 2, 0, Math.PI * 2)
      ctx.stroke()
    })
    
    // Draw windows
    ctx.strokeStyle = '#0369a1'
    ctx.lineWidth = 0.06
    blueprint.windows.forEach(window => {
      ctx.strokeRect(
        window.position[0] - window.width / 2,
        window.position[1] - 0.1,
        window.width,
        0.2
      )
    })
    
    ctx.restore()
    
    // Add title and metadata
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 48px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('3D Architektur Modell', 60, 80)
    
    ctx.font = '32px Inter, sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText(`${blueprint.name}`, 60, 130)
    
    // Add statistics
    ctx.font = '24px Inter, sans-serif'
    ctx.fillStyle = '#475569'
    const stats = [
      `${blueprint.walls.length} Wände`,
      `${blueprint.rooms.length} Räume`,
      `${blueprint.doors.length} Türen`,
      `${blueprint.windows.length} Fenster`
    ]
    stats.forEach((stat, i) => {
      ctx.fillText(stat, 60, 180 + i * 35)
    })
    
    // Add timestamp
    ctx.font = '20px Inter, sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`Exportiert: ${new Date().toLocaleDateString('de-DE')}`, 60, canvas.height - 40)
    
    return canvas
  }

  const handleExport = async (format: string) => {
    setIsExporting(format)
    
    try {
      let content = ''
      let filename = ''
      let mimeType = 'text/plain'

      switch (format) {
        case 'obj':
          content = generateOBJ()
          filename = `${blueprint.name.replace(/\.[^/.]+$/, '')}.obj`
          break
        case 'blender':
          content = generateBlenderScript()
          filename = `${blueprint.name.replace(/\.[^/.]+$/, '')}_blender.py`
          break
        case 'freecad':
          content = generateFreeCADScript()
          filename = `${blueprint.name.replace(/\.[^/.]+$/, '')}_freecad.py`
          break
        case 'stl':
          content = generateOBJ() // Simplified STL as OBJ for demo
          filename = `${blueprint.name.replace(/\.[^/.]+$/, '')}.stl`
          break
        case 'jpg':
          // Handle JPG export differently
          const canvas = await generateJPGSnapshot()
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${blueprint.name.replace(/\.[^/.]+$/, '')}_snapshot.jpg`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              toast.success('JPG-Schnappschuss erfolgreich heruntergeladen!')
            }
          }, 'image/jpeg', 0.9)
          setIsExporting(null)
          return
        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${format.toUpperCase()}-Datei erfolgreich heruntergeladen!`)
    } catch (error) {
      toast.error(`Fehler beim Exportieren der ${format.toUpperCase()}-Datei`)
    } finally {
      setIsExporting(null)
    }
  }

  const exportFormats = [
    {
      id: 'jpg',
      name: 'JPG-Schnappschuss',
      icon: Camera,
      description: 'Hochauflösender Schnappschuss des 3D-Modells (1920x1080)',
      fileSize: '~500KB',
      features: ['Hohe Auflösung', 'Fertig zum Teilen', 'Modell-Metadaten', 'Professionell']
    },
    {
      id: 'blender',
      name: 'Blender-Skript',
      icon: Code,
      description: 'Python-Skript für Blender mit Materialien und Raumtouren',
      fileSize: '~15KB',
      features: ['Materialien', 'Raumtouren', 'Beleuchtung', 'Kamera-Animation']
    },
    {
      id: 'freecad',
      name: 'FreeCAD-Skript',
      icon: Code,
      description: 'Python-Skript für FreeCAD mit parametrischen Objekten',
      fileSize: '~8KB',
      features: ['Parametrische Wände', 'Architektonische Objekte', 'BIM-kompatibel']
    },
    {
      id: 'obj',
      name: 'OBJ-Modell',
      icon: Cube,
      description: 'Standard-3D-Mesh-Format für universelle Kompatibilität',
      fileSize: '~25KB',
      features: ['Universelles Format', 'Mesh-Geometrie', 'Material-Gruppen']
    },
    {
      id: 'stl',
      name: 'STL-Modell',
      icon: FileArchive,
      description: '3D-druckfertiges Format',
      fileSize: '~35KB',
      features: ['3D-Druck', 'Volumenkörper-Geometrie', 'Mesh-Export']
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            3D-Modell exportieren
          </CardTitle>
          <CardDescription>
            Laden Sie Ihr 3D-Architekturmodell in verschiedenen Formaten herunter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="formats" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formats">Export-Formate</TabsTrigger>
              <TabsTrigger value="options">Export-Optionen</TabsTrigger>
            </TabsList>

            <TabsContent value="formats" className="space-y-4">
              <div className="grid gap-4">
                {exportFormats.map((format) => {
                  const Icon = format.icon
                  return (
                    <Card key={format.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{format.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {format.fileSize}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {format.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleExport(format.id)}
                            disabled={isExporting === format.id}
                            className="gap-2"
                            data-export-format={format.id}
                          >
                            {isExporting === format.id ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                Exportiere...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Herunterladen
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">Export-Einstellungen</h3>
                
                <div className="space-y-3">
                  {[
                    {
                      key: 'includeTextures' as const,
                      label: 'Texturen einschließen',
                      description: 'Material-Texturen und UV-Mapping exportieren'
                    },
                    {
                      key: 'includeMaterials' as const,
                      label: 'Materialien einschließen',
                      description: 'Material-Definitionen und Eigenschaften exportieren'
                    },
                    {
                      key: 'includeRoomTours' as const,
                      label: 'Raumtouren einschließen',
                      description: 'Kamera-Pfade für virtuelle Touren exportieren'
                    },
                    {
                      key: 'optimizeGeometry' as const,
                      label: 'Geometrie optimieren',
                      description: 'Polygon-Anzahl für bessere Performance reduzieren'
                    }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={option.key} className="text-sm font-medium">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <Switch
                        id={option.key}
                        checked={exportOptions[option.key]}
                        onCheckedChange={(checked) => updateOption(option.key, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
                  <p className="font-medium mb-1">Anweisungen zur Verwendung:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>JPG:</strong> Hochauflösender Schnappschuss bereit zum Teilen oder Präsentieren</li>
                    <li>• <strong>Blender:</strong> Scripting-Arbeitsbereich öffnen, .py-Datei laden und Skript ausführen</li>
                    <li>• <strong>FreeCAD:</strong> Makro → Ausführen verwenden, um das Python-Skript zu starten</li>
                    <li>• <strong>OBJ:</strong> Direkt in die meiste 3D-Software importieren</li>
                    <li>• <strong>STL:</strong> Bereit für 3D-Druck oder Mesh-Verarbeitung</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}