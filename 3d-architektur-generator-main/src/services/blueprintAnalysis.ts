/**
 * Blueprint Analysis Service
 * Spezialisierter Service für die Analyse von Bauplänen und Grundrissen
 */

import { BlueprintData, AnalysisParams } from '@/App'
import { blueprintService, ValidationResponse } from './api'

// Typen für Blueprint-Analyse
export interface AnalysisResult {
  walls: Wall[]
  rooms: Room[]
  doors: Door[]
  windows: Window[]
  stairs?: Stair[]
  fixtures?: Fixture[]
  confidence: number
  processingTime: number
}

export interface Wall {
  id: string
  start: [number, number]
  end: [number, number]
  thickness: number
  height: number
  material?: string
  isLoadBearing?: boolean
  connectedWalls?: string[]
}

export interface Room {
  id: string
  name: string
  area: number
  center: [number, number]
  bounds: [number, number, number, number] // [minX, minY, maxX, maxY]
  walls: string[]
  doors: string[]
  windows: string[]
  roomType?: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'other'
}

export interface Door {
  id: string
  position: [number, number]
  width: number
  height: number
  wallId: string
  openDirection?: 'left' | 'right' | 'push' | 'pull'
  doorType?: 'interior' | 'exterior' | 'sliding' | 'folding'
}

export interface Window {
  id: string
  position: [number, number]
  width: number
  height: number
  wallId: string
  sillHeight?: number
  windowType?: 'casement' | 'sliding' | 'fixed' | 'bay'
}

export interface Stair {
  id: string
  start: [number, number]
  end: [number, number]
  steps: number
  width: number
  direction: 'up' | 'down'
}

export interface Fixture {
  id: string
  position: [number, number]
  type: 'sink' | 'toilet' | 'shower' | 'bathtub' | 'counter' | 'cabinet'
  dimensions: [number, number]
  rotation?: number
}

// Analyseparameter mit erweiterten Optionen
export interface ExtendedAnalysisParams extends AnalysisParams {
  detectStairs?: boolean
  detectFixtures?: boolean
  minWallLength?: number
  minRoomArea?: number
  wallDetectionSensitivity?: number
  roomDetectionSensitivity?: number
  useAiEnhancement?: boolean
  preserveOriginalScale?: boolean
}

// Analyse-Qualitäts-Stufen
export type AnalysisQuality = 'fast' | 'balanced' | 'precise' | 'ai-enhanced'

export interface AnalysisOptions {
  quality: AnalysisQuality
  params: ExtendedAnalysisParams
  validateResults: boolean
  generateThumbnail: boolean
}

class BlueprintAnalyzer {
  private static instance: BlueprintAnalyzer
  private processingQueue: Map<string, Promise<AnalysisResult>> = new Map()

  public static getInstance(): BlueprintAnalyzer {
    if (!BlueprintAnalyzer.instance) {
      BlueprintAnalyzer.instance = new BlueprintAnalyzer()
    }
    return BlueprintAnalyzer.instance
  }

  /**
   * Analysiert einen Blueprint und extrahiert architektonische Elemente
   */
  async analyzeBlueprint(
    file: File,
    options: AnalysisOptions,
    onProgress?: (progress: number) => void
  ): Promise<AnalysisResult> {
    const analysisId = this.generateAnalysisId(file)
    
    // Prüfe ob bereits eine Analyse für diese Datei läuft
    if (this.processingQueue.has(analysisId)) {
      return this.processingQueue.get(analysisId)!
    }

    const analysisPromise = this.performAnalysis(file, options, onProgress)
    this.processingQueue.set(analysisId, analysisPromise)

    try {
      const result = await analysisPromise
      return result
    } finally {
      this.processingQueue.delete(analysisId)
    }
  }

  private async performAnalysis(
    file: File,
    options: AnalysisOptions,
    onProgress?: (progress: number) => void
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    
    try {
      // Schritt 1: Datei-Upload (10%)
      onProgress?.(10)
      const uploadResponse = await blueprintService.uploadBlueprint({
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      })

      // Schritt 2: Vorverarbeitung (30%)
      onProgress?.(30)
      const preprocessed = await this.preprocessImage(file, options.params)

      // Schritt 3: Hauptanalyse (70%)
      onProgress?.(70)
      const analysisResponse = await blueprintService.analyzeBlueprint({
        uploadId: uploadResponse.uploadId,
        analysisParams: options.params,
        priority: this.getAnalysisPriority(options.quality)
      })

      // Schritt 4: Nachbearbeitung und Validierung (90%)
      onProgress?.(90)
      const result = await this.postprocessAnalysis(
        analysisResponse.blueprintData,
        options
      )

      // Schritt 5: Fertigstellung (100%)
      onProgress?.(100)
      
      const processingTime = Date.now() - startTime
      return {
        ...result,
        processingTime
      }

    } catch (error) {
      console.error('Blueprint-Analyse fehlgeschlagen:', error)
      throw new Error(`Analyse fehlgeschlagen: ${error.message}`)
    }
  }

  private async preprocessImage(
    file: File,
    params: ExtendedAnalysisParams
  ): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Skalierung basierend auf Parametern
        const scale = params.preserveOriginalScale ? 1 : this.calculateOptimalScale(img)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Bildoptimierung für bessere Analyse
        if (params.useAiEnhancement) {
          this.enhanceImageForAnalysis(ctx, canvas.width, canvas.height)
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      }

      img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'))
      img.src = URL.createObjectURL(file)
    })
  }

  private enhanceImageForAnalysis(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // Kontrastverbesserung
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // Konvertiere zu Graustufen für bessere Linienerkennung
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      // Erhöhe Kontrast
      const contrast = 1.5
      const enhanced = ((gray / 255 - 0.5) * contrast + 0.5) * 255
      
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced))
    }

    ctx.putImageData(imageData, 0, 0)
  }

  private calculateOptimalScale(img: HTMLImageElement): number {
    const maxDimension = 2048
    const scale = Math.min(
      maxDimension / img.width,
      maxDimension / img.height,
      1
    )
    return scale
  }

  private getAnalysisPriority(quality: AnalysisQuality): 'low' | 'normal' | 'high' {
    switch (quality) {
      case 'fast':
        return 'low'
      case 'balanced':
        return 'normal'
      case 'precise':
      case 'ai-enhanced':
        return 'high'
      default:
        return 'normal'
    }
  }

  private async postprocessAnalysis(
    blueprintData: BlueprintData,
    options: AnalysisOptions
  ): Promise<AnalysisResult> {
    // Konvertiere BlueprintData zu AnalysisResult
    const result: AnalysisResult = {
      walls: blueprintData.walls.map(wall => ({
        ...wall,
        height: options.params.wallHeight,
        thickness: wall.thickness || options.params.wallThickness
      })),
      rooms: blueprintData.rooms,
      doors: blueprintData.doors,
      windows: blueprintData.windows,
      confidence: 0.85, // Placeholder
      processingTime: 0 // Wird später gesetzt
    }

    // Validierung falls angefordert
    if (options.validateResults) {
      const validation = await this.validateAnalysisResult(result)
      if (!validation.isValid) {
        console.warn('Analyse-Validierung fehlgeschlagen:', validation.errors)
      }
    }

    // Nachbearbeitung basierend auf Parametern
    if (options.params.detectStairs) {
      result.stairs = await this.detectStairs(result)
    }

    if (options.params.detectFixtures) {
      result.fixtures = await this.detectFixtures(result)
    }

    return result
  }

  private async validateAnalysisResult(result: AnalysisResult): Promise<ValidationResponse> {
    // Lokale Validierung
    const errors: string[] = []
    const warnings: string[] = []

    // Minimale Anzahl von Wänden
    if (result.walls.length < 3) {
      errors.push('Zu wenige Wände erkannt (mindestens 3 erforderlich)')
    }

    // Mindestens ein Raum
    if (result.rooms.length === 0) {
      errors.push('Keine Räume erkannt')
    }

    // Wandverbindungen prüfen
    const unconnectedWalls = result.walls.filter(wall => 
      !this.isWallConnected(wall, result.walls)
    )
    if (unconnectedWalls.length > 0) {
      warnings.push(`${unconnectedWalls.length} unverbundene Wände gefunden`)
    }

    const score = this.calculateValidationScore(result, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    }
  }

  private isWallConnected(wall: Wall, allWalls: Wall[]): boolean {
    const threshold = 0.1 // 10cm Toleranz
    
    return allWalls.some(otherWall => {
      if (otherWall.id === wall.id) return false
      
      // Prüfe ob Endpunkte sich berühren
      const startToStart = this.distance(wall.start, otherWall.start) < threshold
      const startToEnd = this.distance(wall.start, otherWall.end) < threshold
      const endToStart = this.distance(wall.end, otherWall.start) < threshold
      const endToEnd = this.distance(wall.end, otherWall.end) < threshold
      
      return startToStart || startToEnd || endToStart || endToEnd
    })
  }

  private distance(point1: [number, number], point2: [number, number]): number {
    const dx = point1[0] - point2[0]
    const dy = point1[1] - point2[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateValidationScore(
    result: AnalysisResult,
    errors: string[],
    warnings: string[]
  ): number {
    let score = 100

    // Abzüge für Fehler und Warnungen
    score -= errors.length * 20
    score -= warnings.length * 5

    // Bonus für Vollständigkeit
    if (result.rooms.length > 0) score += 10
    if (result.doors.length > 0) score += 5
    if (result.windows.length > 0) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private async detectStairs(result: AnalysisResult): Promise<Stair[]> {
    // Placeholder für Treppenerkennung
    // In einer echten Implementierung würde hier ein spezialisierter Algorithmus verwendet
    return []
  }

  private async detectFixtures(result: AnalysisResult): Promise<Fixture[]> {
    // Placeholder für Einrichtungserkennung
    // In einer echten Implementierung würde hier ein spezialisierter Algorithmus verwendet
    return []
  }

  private generateAnalysisId(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`
  }

  /**
   * Bricht eine laufende Analyse ab
   */
  async cancelAnalysis(file: File): Promise<void> {
    const analysisId = this.generateAnalysisId(file)
    this.processingQueue.delete(analysisId)
  }

  /**
   * Ruft den Status einer laufenden Analyse ab
   */
  getAnalysisStatus(file: File): 'idle' | 'processing' | 'completed' {
    const analysisId = this.generateAnalysisId(file)
    return this.processingQueue.has(analysisId) ? 'processing' : 'idle'
  }
}

// Vordefinierte Analyse-Presets
export const analysisPresets: Record<string, AnalysisOptions> = {
  schnell: {
    quality: 'fast',
    params: {
      wallHeight: 2.5,
      wallThickness: 0.15,
      generateDoors: true,
      generateWindows: true,
      generateRoof: false,
      detectStairs: false,
      detectFixtures: false,
      minWallLength: 0.5,
      minRoomArea: 2.0,
      wallDetectionSensitivity: 0.7,
      roomDetectionSensitivity: 0.6,
      useAiEnhancement: false,
      preserveOriginalScale: false
    },
    validateResults: false,
    generateThumbnail: true
  },
  
  ausgewogen: {
    quality: 'balanced',
    params: {
      wallHeight: 2.5,
      wallThickness: 0.15,
      generateDoors: true,
      generateWindows: true,
      generateRoof: false,
      detectStairs: true,
      detectFixtures: false,
      minWallLength: 0.3,
      minRoomArea: 1.5,
      wallDetectionSensitivity: 0.8,
      roomDetectionSensitivity: 0.7,
      useAiEnhancement: true,
      preserveOriginalScale: true
    },
    validateResults: true,
    generateThumbnail: true
  },
  
  praezise: {
    quality: 'precise',
    params: {
      wallHeight: 2.5,
      wallThickness: 0.15,
      generateDoors: true,
      generateWindows: true,
      generateRoof: true,
      detectStairs: true,
      detectFixtures: true,
      minWallLength: 0.2,
      minRoomArea: 1.0,
      wallDetectionSensitivity: 0.9,
      roomDetectionSensitivity: 0.8,
      useAiEnhancement: true,
      preserveOriginalScale: true
    },
    validateResults: true,
    generateThumbnail: true
  }
}

// Exportiere Singleton-Instanz
export const blueprintAnalyzer = BlueprintAnalyzer.getInstance()

// Hilfsfunktionen für Blueprint-Validierung
export const blueprintValidation = {
  /**
   * Validiert Dateiformate
   */
  isValidFileType(file: File): boolean {
    const supportedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'application/pdf'
    ]
    return supportedTypes.includes(file.type)
  },

  /**
   * Validiert Dateigröße
   */
  isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
  },

  /**
   * Schätzt die Analysezeit basierend auf Dateigröße und Qualität
   */
  estimateAnalysisTime(file: File, quality: AnalysisQuality): number {
    const baseSizeTime = (file.size / (1024 * 1024)) * 2000 // 2s per MB
    const qualityMultiplier = {
      fast: 0.5,
      balanced: 1.0,
      precise: 2.0,
      'ai-enhanced': 3.0
    }
    
    return baseSizeTime * qualityMultiplier[quality]
  },

  /**
   * Validiert Blueprint-Dimensionen
   */
  async validateImageDimensions(file: File): Promise<{ width: number; height: number; isValid: boolean }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const minSize = 100
        const maxSize = 4096
        const isValid = img.width >= minSize && img.height >= minSize &&
                       img.width <= maxSize && img.height <= maxSize
        
        resolve({
          width: img.width,
          height: img.height,
          isValid
        })
      }
      img.onerror = () => resolve({ width: 0, height: 0, isValid: false })
      img.src = URL.createObjectURL(file)
    })
  }
}