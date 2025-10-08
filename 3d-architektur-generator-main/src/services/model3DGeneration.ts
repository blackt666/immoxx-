/**
 * 3D Model Generation Service
 * Spezialisierter Service für die Generierung von 3D-Modellen aus Blueprint-Daten
 */

import { BlueprintData } from '@/App'
import { AnalysisResult } from './blueprintAnalysis'
import { modelService, ExportModelRequest, ExportModelResponse } from './api'

// 3D-Modell-Typen und Interfaces
export interface Model3D {
  id: string
  name: string
  blueprintId: string
  geometry: ModelGeometry
  materials: ModelMaterial[]
  lighting: LightingSetup
  metadata: ModelMetadata
  quality: ModelQuality
  status: 'generating' | 'completed' | 'failed'
  createdAt: Date
  fileSize: number
  thumbnailUrl?: string
}

export interface ModelGeometry {
  vertices: Float32Array
  indices: Uint32Array
  normals: Float32Array
  uvs: Float32Array
  groups: GeometryGroup[]
}

export interface GeometryGroup {
  name: string
  materialIndex: number
  start: number
  count: number
  type: 'wall' | 'floor' | 'ceiling' | 'door' | 'window' | 'roof'
}

export interface ModelMaterial {
  id: string
  name: string
  type: 'standard' | 'pbr' | 'phong' | 'basic'
  properties: MaterialProperties
  textures: MaterialTextures
}

export interface MaterialProperties {
  color: [number, number, number]
  opacity: number
  metalness?: number
  roughness?: number
  emissive?: [number, number, number]
  specular?: [number, number, number]
  shininess?: number
}

export interface MaterialTextures {
  diffuse?: string
  normal?: string
  roughness?: string
  metalness?: string
  ao?: string
  displacement?: string
}

export interface LightingSetup {
  ambientLight: {
    color: [number, number, number]
    intensity: number
  }
  directionalLights: DirectionalLight[]
  pointLights: PointLight[]
  spotLights: SpotLight[]
}

export interface DirectionalLight {
  id: string
  color: [number, number, number]
  intensity: number
  direction: [number, number, number]
  castShadow: boolean
}

export interface PointLight {
  id: string
  color: [number, number, number]
  intensity: number
  position: [number, number, number]
  distance: number
  decay: number
  castShadow: boolean
}

export interface SpotLight {
  id: string
  color: [number, number, number]
  intensity: number
  position: [number, number, number]
  target: [number, number, number]
  angle: number
  penumbra: number
  distance: number
  decay: number
  castShadow: boolean
}

export interface ModelMetadata {
  scale: [number, number, number]
  units: 'meters' | 'feet' | 'inches' | 'centimeters'
  boundingBox: {
    min: [number, number, number]
    max: [number, number, number]
  }
  centerPoint: [number, number, number]
  totalVolume: number
  floorArea: number
  wallArea: number
  roomCount: number
  doorCount: number
  windowCount: number
}

export type ModelQuality = 'low' | 'medium' | 'high' | 'ultra'

// Generierungs-Optionen
export interface GenerationOptions {
  quality: ModelQuality
  includeTextures: boolean
  includeLighting: boolean
  includeRoof: boolean
  includeFoundation: boolean
  wallDetail: 'simple' | 'detailed' | 'realistic'
  floorDetail: 'flat' | 'textured' | 'realistic'
  optimizeForWeb: boolean
  generateLOD: boolean // Level of Detail
  compressionLevel: number // 0-100
}

// Material-Bibliothek
export interface MaterialLibrary {
  walls: MaterialTemplate[]
  floors: MaterialTemplate[]
  ceilings: MaterialTemplate[]
  doors: MaterialTemplate[]
  windows: MaterialTemplate[]
  roofs: MaterialTemplate[]
}

export interface MaterialTemplate {
  id: string
  name: string
  category: string
  properties: MaterialProperties
  textureUrls: {
    diffuse?: string
    normal?: string
    roughness?: string
    metalness?: string
    ao?: string
  }
  scale: [number, number]
}

class Model3DGenerator {
  private static instance: Model3DGenerator
  private materialLibrary: MaterialLibrary | null = null
  private generationQueue: Map<string, Promise<Model3D>> = new Map()

  public static getInstance(): Model3DGenerator {
    if (!Model3DGenerator.instance) {
      Model3DGenerator.instance = new Model3DGenerator()
    }
    return Model3DGenerator.instance
  }

  /**
   * Generiert ein 3D-Modell aus Blueprint-Analyse-Daten
   */
  async generateModel(
    analysisResult: AnalysisResult,
    options: GenerationOptions,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<Model3D> {
    const modelId = this.generateModelId(analysisResult)
    
    // Prüfe ob bereits eine Generierung für diese Daten läuft
    if (this.generationQueue.has(modelId)) {
      return this.generationQueue.get(modelId)!
    }

    const generationPromise = this.performGeneration(analysisResult, options, onProgress)
    this.generationQueue.set(modelId, generationPromise)

    try {
      const result = await generationPromise
      return result
    } finally {
      this.generationQueue.delete(modelId)
    }
  }

  private async performGeneration(
    analysisResult: AnalysisResult,
    options: GenerationOptions,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<Model3D> {
    const startTime = Date.now()
    
    try {
      // Stage 1: Initialisierung und Validierung (10%)
      onProgress?.(10, 'Initialisierung')
      await this.initializeMaterialLibrary()
      this.validateAnalysisResult(analysisResult)

      // Stage 2: Geometrie-Generierung (40%)
      onProgress?.(25, 'Wände generieren')
      const wallGeometry = await this.generateWallGeometry(analysisResult.walls, options)
      
      onProgress?.(35, 'Böden generieren')
      const floorGeometry = await this.generateFloorGeometry(analysisResult.rooms, options)
      
      onProgress?.(45, 'Decken generieren')
      const ceilingGeometry = await this.generateCeilingGeometry(analysisResult.rooms, options)

      // Stage 3: Türen und Fenster (60%)
      onProgress?.(50, 'Türen generieren')
      const doorGeometry = await this.generateDoorGeometry(analysisResult.doors, options)
      
      onProgress?.(60, 'Fenster generieren')
      const windowGeometry = await this.generateWindowGeometry(analysisResult.windows, options)

      // Stage 4: Optionale Elemente (70%)
      let roofGeometry: ModelGeometry | null = null
      if (options.includeRoof && analysisResult.rooms.length > 0) {
        onProgress?.(70, 'Dach generieren')
        roofGeometry = await this.generateRoofGeometry(analysisResult.rooms, options)
      }

      // Stage 5: Geometrie zusammenführen (80%)
      onProgress?.(80, 'Geometrie zusammenführen')
      const combinedGeometry = await this.combineGeometry([
        wallGeometry,
        floorGeometry,
        ceilingGeometry,
        doorGeometry,
        windowGeometry,
        ...(roofGeometry ? [roofGeometry] : [])
      ])

      // Stage 6: Materialien anwenden (90%)
      onProgress?.(90, 'Materialien anwenden')
      const materials = await this.generateMaterials(analysisResult, options)

      // Stage 7: Beleuchtung einrichten (95%)
      onProgress?.(95, 'Beleuchtung einrichten')
      const lighting = await this.generateLighting(analysisResult, options)

      // Stage 8: Metadaten und Finalisierung (100%)
      onProgress?.(100, 'Finalisierung')
      const metadata = await this.generateMetadata(analysisResult, combinedGeometry)

      const model: Model3D = {
        id: this.generateModelId(analysisResult),
        name: `3D-Modell ${new Date().toLocaleDateString()}`,
        blueprintId: analysisResult.walls[0]?.id || 'unknown',
        geometry: combinedGeometry,
        materials,
        lighting,
        metadata,
        quality: options.quality,
        status: 'completed',
        createdAt: new Date(),
        fileSize: this.calculateFileSize(combinedGeometry, materials),
        thumbnailUrl: await this.generateThumbnail(combinedGeometry, materials, lighting)
      }

      return model

    } catch (error) {
      console.error('3D-Modell-Generierung fehlgeschlagen:', error)
      throw new Error(`Generierung fehlgeschlagen: ${error.message}`)
    }
  }

  private async initializeMaterialLibrary(): Promise<void> {
    if (this.materialLibrary) return

    this.materialLibrary = {
      walls: [
        {
          id: 'concrete_wall',
          name: 'Beton',
          category: 'walls',
          properties: {
            color: [0.8, 0.8, 0.8],
            opacity: 1.0,
            roughness: 0.8,
            metalness: 0.0
          },
          textureUrls: {
            diffuse: '/textures/concrete_diffuse.jpg',
            normal: '/textures/concrete_normal.jpg',
            roughness: '/textures/concrete_roughness.jpg'
          },
          scale: [2, 2]
        },
        {
          id: 'brick_wall',
          name: 'Ziegel',
          category: 'walls',
          properties: {
            color: [0.7, 0.4, 0.3],
            opacity: 1.0,
            roughness: 0.9,
            metalness: 0.0
          },
          textureUrls: {
            diffuse: '/textures/brick_diffuse.jpg',
            normal: '/textures/brick_normal.jpg'
          },
          scale: [1, 1]
        }
      ],
      floors: [
        {
          id: 'wood_floor',
          name: 'Parkett',
          category: 'floors',
          properties: {
            color: [0.6, 0.4, 0.2],
            opacity: 1.0,
            roughness: 0.3,
            metalness: 0.0
          },
          textureUrls: {
            diffuse: '/textures/wood_diffuse.jpg',
            normal: '/textures/wood_normal.jpg'
          },
          scale: [4, 4]
        }
      ],
      ceilings: [
        {
          id: 'white_ceiling',
          name: 'Weiße Decke',
          category: 'ceilings',
          properties: {
            color: [0.95, 0.95, 0.95],
            opacity: 1.0,
            roughness: 0.5,
            metalness: 0.0
          },
          textureUrls: {},
          scale: [1, 1]
        }
      ],
      doors: [
        {
          id: 'wood_door',
          name: 'Holztür',
          category: 'doors',
          properties: {
            color: [0.5, 0.3, 0.2],
            opacity: 1.0,
            roughness: 0.4,
            metalness: 0.0
          },
          textureUrls: {
            diffuse: '/textures/door_wood_diffuse.jpg'
          },
          scale: [1, 1]
        }
      ],
      windows: [
        {
          id: 'clear_glass',
          name: 'Klarglas',
          category: 'windows',
          properties: {
            color: [0.9, 0.9, 1.0],
            opacity: 0.3,
            roughness: 0.0,
            metalness: 0.0
          },
          textureUrls: {},
          scale: [1, 1]
        }
      ],
      roofs: [
        {
          id: 'tile_roof',
          name: 'Ziegeldach',
          category: 'roofs',
          properties: {
            color: [0.6, 0.3, 0.2],
            opacity: 1.0,
            roughness: 0.8,
            metalness: 0.0
          },
          textureUrls: {
            diffuse: '/textures/roof_tiles_diffuse.jpg',
            normal: '/textures/roof_tiles_normal.jpg'
          },
          scale: [2, 2]
        }
      ]
    }
  }

  private validateAnalysisResult(result: AnalysisResult): void {
    if (!result.walls || result.walls.length < 3) {
      throw new Error('Unzureichende Wanddaten für 3D-Generierung')
    }
    
    if (!result.rooms || result.rooms.length === 0) {
      throw new Error('Keine Räume für 3D-Generierung gefunden')
    }
  }

  private async generateWallGeometry(
    walls: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    const vertices: number[] = []
    const indices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const groups: GeometryGroup[] = []

    let vertexIndex = 0

    for (const wall of walls) {
      const wallVertices = this.createWallVertices(wall, options)
      const wallIndices = this.createWallIndices(vertexIndex, wallVertices.length / 3)
      const wallNormals = this.createWallNormals(wallVertices)
      const wallUvs = this.createWallUVs(wallVertices.length / 3)

      vertices.push(...wallVertices)
      indices.push(...wallIndices)
      normals.push(...wallNormals)
      uvs.push(...wallUvs)

      groups.push({
        name: `wall_${wall.id}`,
        materialIndex: 0,
        start: vertexIndex,
        count: wallIndices.length,
        type: 'wall'
      })

      vertexIndex += wallVertices.length / 3
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      groups
    }
  }

  private createWallVertices(wall: any, options: GenerationOptions): number[] {
    const { start, end, thickness, height } = wall
    const halfThickness = thickness / 2

    // Wandrichtung berechnen
    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    const length = Math.sqrt(dx * dx + dy * dy)
    const normalX = -dy / length
    const normalY = dx / length

    // 8 Eckpunkte für eine Box (Wand)
    const vertices = [
      // Unterseite
      start[0] + normalX * halfThickness, 0, start[1] + normalY * halfThickness,
      end[0] + normalX * halfThickness, 0, end[1] + normalY * halfThickness,
      end[0] - normalX * halfThickness, 0, end[1] - normalY * halfThickness,
      start[0] - normalX * halfThickness, 0, start[1] - normalY * halfThickness,
      
      // Oberseite
      start[0] + normalX * halfThickness, height, start[1] + normalY * halfThickness,
      end[0] + normalX * halfThickness, height, end[1] + normalY * halfThickness,
      end[0] - normalX * halfThickness, height, end[1] - normalY * halfThickness,
      start[0] - normalX * halfThickness, height, start[1] - normalY * halfThickness
    ]

    return vertices
  }

  private createWallIndices(startIndex: number, vertexCount: number): number[] {
    // Indizes für die 6 Flächen einer Box
    const indices = [
      // Boden
      0, 1, 2, 0, 2, 3,
      // Decke
      4, 7, 6, 4, 6, 5,
      // Seiten
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0
    ]

    return indices.map(i => i + startIndex)
  }

  private createWallNormals(vertices: number[]): number[] {
    // Vereinfachte Normale für jede Ecke
    const normals: number[] = []
    for (let i = 0; i < vertices.length; i += 3) {
      normals.push(0, 1, 0) // Zeigt nach oben
    }
    return normals
  }

  private createWallUVs(vertexCount: number): number[] {
    const uvs: number[] = []
    for (let i = 0; i < vertexCount; i++) {
      uvs.push(0, 0) // Vereinfachte UV-Koordinaten
    }
    return uvs
  }

  private async generateFloorGeometry(
    rooms: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    // Implementierung ähnlich zu generateWallGeometry
    // Hier würde die Bodenflächen-Geometrie generiert
    return {
      vertices: new Float32Array([]),
      indices: new Uint32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      groups: []
    }
  }

  private async generateCeilingGeometry(
    rooms: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    // Implementierung für Decken-Geometrie
    return {
      vertices: new Float32Array([]),
      indices: new Uint32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      groups: []
    }
  }

  private async generateDoorGeometry(
    doors: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    // Implementierung für Türen-Geometrie
    return {
      vertices: new Float32Array([]),
      indices: new Uint32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      groups: []
    }
  }

  private async generateWindowGeometry(
    windows: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    // Implementierung für Fenster-Geometrie
    return {
      vertices: new Float32Array([]),
      indices: new Uint32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      groups: []
    }
  }

  private async generateRoofGeometry(
    rooms: any[],
    options: GenerationOptions
  ): Promise<ModelGeometry> {
    // Implementierung für Dach-Geometrie
    return {
      vertices: new Float32Array([]),
      indices: new Uint32Array([]),
      normals: new Float32Array([]),
      uvs: new Float32Array([]),
      groups: []
    }
  }

  private async combineGeometry(geometries: ModelGeometry[]): Promise<ModelGeometry> {
    let totalVertices = 0
    let totalIndices = 0

    geometries.forEach(geom => {
      totalVertices += geom.vertices.length
      totalIndices += geom.indices.length
    })

    const combinedVertices = new Float32Array(totalVertices)
    const combinedIndices = new Uint32Array(totalIndices)
    const combinedNormals = new Float32Array(totalVertices)
    const combinedUvs = new Float32Array((totalVertices / 3) * 2)
    const combinedGroups: GeometryGroup[] = []

    let vertexOffset = 0
    let indexOffset = 0
    let uvOffset = 0

    geometries.forEach(geom => {
      // Vertices kopieren
      combinedVertices.set(geom.vertices, vertexOffset)
      combinedNormals.set(geom.normals, vertexOffset)
      
      // Indices kopieren und anpassen
      const adjustedIndices = Array.from(geom.indices).map(i => i + vertexOffset / 3)
      combinedIndices.set(adjustedIndices, indexOffset)
      
      // UVs kopieren
      combinedUvs.set(geom.uvs, uvOffset)
      
      // Gruppen kopieren und anpassen
      geom.groups.forEach(group => {
        combinedGroups.push({
          ...group,
          start: group.start + indexOffset
        })
      })

      vertexOffset += geom.vertices.length
      indexOffset += geom.indices.length
      uvOffset += geom.uvs.length
    })

    return {
      vertices: combinedVertices,
      indices: combinedIndices,
      normals: combinedNormals,
      uvs: combinedUvs,
      groups: combinedGroups
    }
  }

  private async generateMaterials(
    analysisResult: AnalysisResult,
    options: GenerationOptions
  ): Promise<ModelMaterial[]> {
    if (!this.materialLibrary) {
      await this.initializeMaterialLibrary()
    }

    const materials: ModelMaterial[] = []

    // Standard-Wandmaterial
    materials.push({
      id: 'wall_material',
      name: 'Wandmaterial',
      type: options.includeTextures ? 'pbr' : 'standard',
      properties: this.materialLibrary!.walls[0].properties,
      textures: options.includeTextures ? this.materialLibrary!.walls[0].textureUrls : {}
    })

    // Weitere Materialien basierend auf den erkannten Elementen
    if (analysisResult.doors.length > 0) {
      materials.push({
        id: 'door_material',
        name: 'Türmaterial',
        type: 'standard',
        properties: this.materialLibrary!.doors[0].properties,
        textures: options.includeTextures ? this.materialLibrary!.doors[0].textureUrls : {}
      })
    }

    if (analysisResult.windows.length > 0) {
      materials.push({
        id: 'window_material',
        name: 'Fenstermaterial',
        type: 'standard',
        properties: this.materialLibrary!.windows[0].properties,
        textures: {}
      })
    }

    return materials
  }

  private async generateLighting(
    analysisResult: AnalysisResult,
    options: GenerationOptions
  ): Promise<LightingSetup> {
    if (!options.includeLighting) {
      return {
        ambientLight: { color: [1, 1, 1], intensity: 0.5 },
        directionalLights: [],
        pointLights: [],
        spotLights: []
      }
    }

    // Grundbeleuchtung
    const lighting: LightingSetup = {
      ambientLight: {
        color: [1, 1, 1],
        intensity: 0.3
      },
      directionalLights: [
        {
          id: 'sun',
          color: [1, 1, 0.9],
          intensity: 1.0,
          direction: [-0.5, -1, -0.5],
          castShadow: true
        }
      ],
      pointLights: [],
      spotLights: []
    }

    // Raumspezifische Beleuchtung
    analysisResult.rooms.forEach((room, index) => {
      lighting.pointLights.push({
        id: `room_light_${index}`,
        color: [1, 1, 1],
        intensity: 0.8,
        position: [room.center[0], 2.3, room.center[1]],
        distance: 10,
        decay: 2,
        castShadow: false
      })
    })

    return lighting
  }

  private async generateMetadata(
    analysisResult: AnalysisResult,
    geometry: ModelGeometry
  ): Promise<ModelMetadata> {
    // Bounding Box berechnen
    const vertices = Array.from(geometry.vertices)
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    for (let i = 0; i < vertices.length; i += 3) {
      minX = Math.min(minX, vertices[i])
      maxX = Math.max(maxX, vertices[i])
      minY = Math.min(minY, vertices[i + 1])
      maxY = Math.max(maxY, vertices[i + 1])
      minZ = Math.min(minZ, vertices[i + 2])
      maxZ = Math.max(maxZ, vertices[i + 2])
    }

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    // Flächen berechnen
    const floorArea = analysisResult.rooms.reduce((sum, room) => sum + room.area, 0)
    const wallArea = analysisResult.walls.reduce((sum, wall) => {
      const length = Math.sqrt(
        Math.pow(wall.end[0] - wall.start[0], 2) + 
        Math.pow(wall.end[1] - wall.start[1], 2)
      )
      return sum + (length * wall.height)
    }, 0)

    const volume = (maxX - minX) * (maxY - minY) * (maxZ - minZ)

    return {
      scale: [1, 1, 1],
      units: 'meters',
      boundingBox: {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      },
      centerPoint: [centerX, centerY, centerZ],
      totalVolume: volume,
      floorArea,
      wallArea,
      roomCount: analysisResult.rooms.length,
      doorCount: analysisResult.doors.length,
      windowCount: analysisResult.windows.length
    }
  }

  private calculateFileSize(geometry: ModelGeometry, materials: ModelMaterial[]): number {
    // Geschätzte Dateigröße basierend auf Geometrie und Materialien
    const vertexSize = geometry.vertices.byteLength
    const indexSize = geometry.indices.byteLength
    const normalSize = geometry.normals.byteLength
    const uvSize = geometry.uvs.byteLength
    const materialSize = materials.length * 1024 // Geschätzt 1KB pro Material

    return vertexSize + indexSize + normalSize + uvSize + materialSize
  }

  private async generateThumbnail(
    geometry: ModelGeometry,
    materials: ModelMaterial[],
    lighting: LightingSetup
  ): Promise<string> {
    // Hier würde ein Thumbnail-Rendering implementiert
    // Für jetzt Placeholder
    return '/thumbnails/model_placeholder.png'
  }

  private generateModelId(analysisResult: AnalysisResult): string {
    const wallIds = analysisResult.walls.map(w => w.id).join('_')
    return `model_${Date.now()}_${wallIds.substring(0, 8)}`
  }

  /**
   * Exportiert ein 3D-Modell in verschiedene Formate
   */
  async exportModel(
    model: Model3D,
    format: 'gltf' | 'obj' | 'fbx' | 'stl' | 'ply',
    options: Partial<ExportModelRequest> = {}
  ): Promise<ExportModelResponse> {
    const exportRequest: ExportModelRequest = {
      modelId: model.id,
      format,
      compression: options.compression ?? true,
      includeTextures: options.includeTextures ?? true,
      scale: options.scale ?? 1.0
    }

    return modelService.exportModel(exportRequest)
  }

  /**
   * Optimiert ein Modell für Web-Anzeige
   */
  async optimizeForWeb(model: Model3D): Promise<Model3D> {
    // Implementierung für Web-Optimierung
    // - Geometrie-Vereinfachung
    // - Textur-Kompression
    // - LOD-Generierung
    
    return { ...model } // Placeholder
  }

  /**
   * Generiert Level-of-Detail Versionen
   */
  async generateLOD(model: Model3D, levels: number[]): Promise<Model3D[]> {
    const lodModels: Model3D[] = []
    
    for (const level of levels) {
      // Hier würde die LOD-Generierung implementiert
      const lodModel = { ...model, id: `${model.id}_lod_${level}` }
      lodModels.push(lodModel)
    }
    
    return lodModels
  }
}

// Standard-Generierungs-Presets
export const generationPresets: Record<string, GenerationOptions> = {
  schnell: {
    quality: 'low',
    includeTextures: false,
    includeLighting: false,
    includeRoof: false,
    includeFoundation: false,
    wallDetail: 'simple',
    floorDetail: 'flat',
    optimizeForWeb: true,
    generateLOD: false,
    compressionLevel: 80
  },
  
  standard: {
    quality: 'medium',
    includeTextures: true,
    includeLighting: true,
    includeRoof: false,
    includeFoundation: false,
    wallDetail: 'detailed',
    floorDetail: 'textured',
    optimizeForWeb: true,
    generateLOD: true,
    compressionLevel: 60
  },
  
  hochwertig: {
    quality: 'high',
    includeTextures: true,
    includeLighting: true,
    includeRoof: true,
    includeFoundation: true,
    wallDetail: 'realistic',
    floorDetail: 'realistic',
    optimizeForWeb: false,
    generateLOD: true,
    compressionLevel: 40
  },
  
  ultra: {
    quality: 'ultra',
    includeTextures: true,
    includeLighting: true,
    includeRoof: true,
    includeFoundation: true,
    wallDetail: 'realistic',
    floorDetail: 'realistic',
    optimizeForWeb: false,
    generateLOD: true,
    compressionLevel: 20
  }
}

// Exportiere Singleton-Instanz
export const model3DGenerator = Model3DGenerator.getInstance()