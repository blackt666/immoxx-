/**
 * API Service Layer
 * Zentrale API-Schnittstelle für alle Backend-Kommunikation
 */

import { BlueprintData, AnalysisParams } from '@/App'

// API Konfiguration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api'
const API_TIMEOUT = 30000 // 30 Sekunden

// Fehlertypen für bessere Typisierung
export interface ApiError {
  code: string
  message: string
  details?: any
}

export class ApiException extends Error {
  constructor(public error: ApiError) {
    super(error.message)
    this.name = 'ApiException'
  }
}

// Request/Response Typen für alle API Endpunkte
export interface UploadBlueprintRequest {
  file: File
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UploadBlueprintResponse {
  uploadId: string
  presignedUrl?: string
  status: 'uploaded' | 'processing'
}

export interface AnalyzeBlueprintRequest {
  uploadId: string
  analysisParams: AnalysisParams
  priority?: 'low' | 'normal' | 'high'
}

export interface AnalyzeBlueprintResponse {
  analysisId: string
  blueprintData: BlueprintData
  status: 'completed' | 'processing' | 'failed'
  processingTime: number
  confidence: number
}

export interface Generate3DModelRequest {
  blueprintData: BlueprintData
  quality: 'low' | 'medium' | 'high'
  includeTextures: boolean
  includeLighting: boolean
}

export interface Generate3DModelResponse {
  modelId: string
  modelUrl: string
  thumbnailUrl: string
  fileSize: number
  format: string
  processingTime: number
}

export interface ExportModelRequest {
  modelId: string
  format: 'gltf' | 'obj' | 'fbx' | 'stl' | 'ply'
  compression?: boolean
  includeTextures?: boolean
  scale?: number
}

export interface ExportModelResponse {
  exportId: string
  downloadUrl: string
  fileSize: number
  expiresAt: string
}

export interface ValidationRequest {
  data: any
  validationType: 'blueprint' | 'analysis' | '3d-model' | 'export'
}

export interface ValidationResponse {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number
}

// Hilfsfunktionen für HTTP Requests
class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const controller = new AbortController()
    
    // Timeout handling
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiException({
          code: `HTTP_${response.status}`,
          message: errorData.message || response.statusText,
          details: errorData
        })
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiException) {
        throw error
      }
      
      if (error.name === 'AbortError') {
        throw new ApiException({
          code: 'TIMEOUT',
          message: 'Anfrage ist abgelaufen'
        })
      }

      throw new ApiException({
        code: 'NETWORK_ERROR',
        message: 'Netzwerkfehler beim Verbinden mit dem Server',
        details: error
      })
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async uploadFile<T>(endpoint: string, file: File, additionalData?: any): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key])
      })
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Entferne Content-Type für FormData
    })
  }
}

// Singleton API Client Instanz
const apiClient = new ApiClient()

// Spezialisierte Service Funktionen
export const blueprintService = {
  /**
   * Lädt eine Blueprint-Datei zum Server hoch
   */
  async uploadBlueprint(request: UploadBlueprintRequest): Promise<UploadBlueprintResponse> {
    return apiClient.uploadFile('/blueprints/upload', request.file, {
      fileName: request.fileName,
      fileSize: request.fileSize,
      mimeType: request.mimeType
    })
  },

  /**
   * Analysiert einen hochgeladenen Blueprint
   */
  async analyzeBlueprint(request: AnalyzeBlueprintRequest): Promise<AnalyzeBlueprintResponse> {
    return apiClient.post('/blueprints/analyze', request)
  },

  /**
   * Ruft den Status einer laufenden Analyse ab
   */
  async getAnalysisStatus(analysisId: string): Promise<{ status: string; progress: number }> {
    return apiClient.get(`/blueprints/analysis/${analysisId}/status`)
  },

  /**
   * Validiert Blueprint-Daten
   */
  async validateBlueprint(blueprintData: BlueprintData): Promise<ValidationResponse> {
    return apiClient.post('/blueprints/validate', {
      data: blueprintData,
      validationType: 'blueprint'
    })
  }
}

export const modelService = {
  /**
   * Generiert ein 3D-Modell aus Blueprint-Daten
   */
  async generate3DModel(request: Generate3DModelRequest): Promise<Generate3DModelResponse> {
    return apiClient.post('/models/generate', request)
  },

  /**
   * Ruft den Status einer laufenden 3D-Generierung ab
   */
  async getGenerationStatus(modelId: string): Promise<{ status: string; progress: number }> {
    return apiClient.get(`/models/generation/${modelId}/status`)
  },

  /**
   * Exportiert ein 3D-Modell in verschiedene Formate
   */
  async exportModel(request: ExportModelRequest): Promise<ExportModelResponse> {
    return apiClient.post('/models/export', request)
  },

  /**
   * Validiert 3D-Modell-Daten
   */
  async validateModel(modelData: any): Promise<ValidationResponse> {
    return apiClient.post('/models/validate', {
      data: modelData,
      validationType: '3d-model'
    })
  },

  /**
   * Löscht ein 3D-Modell
   */
  async deleteModel(modelId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/models/${modelId}`)
  }
}

export const exportService = {
  /**
   * Ruft verfügbare Export-Formate ab
   */
  async getAvailableFormats(): Promise<{ formats: string[] }> {
    return apiClient.get('/export/formats')
  },

  /**
   * Ruft den Status eines Export-Vorgangs ab
   */
  async getExportStatus(exportId: string): Promise<{ status: string; progress: number }> {
    return apiClient.get(`/export/${exportId}/status`)
  },

  /**
   * Lädt eine exportierte Datei herunter
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/${exportId}/download`)
    
    if (!response.ok) {
      throw new ApiException({
        code: 'DOWNLOAD_ERROR',
        message: 'Fehler beim Herunterladen der Datei'
      })
    }
    
    return response.blob()
  }
}

export const validationService = {
  /**
   * Führt umfassende Validierung durch
   */
  async validateData(request: ValidationRequest): Promise<ValidationResponse> {
    return apiClient.post('/validation/validate', request)
  },

  /**
   * Ruft Validierungsregeln ab
   */
  async getValidationRules(type: string): Promise<{ rules: any[] }> {
    return apiClient.get(`/validation/rules/${type}`)
  }
}

export const testService = {
  /**
   * Führt E2E-Tests durch
   */
  async runE2ETest(testConfig?: any): Promise<{ testId: string }> {
    return apiClient.post('/tests/e2e/run', testConfig)
  },

  /**
   * Ruft E2E-Test-Ergebnisse ab
   */
  async getTestResults(testId: string): Promise<any> {
    return apiClient.get(`/tests/e2e/${testId}/results`)
  },

  /**
   * Ruft Test-Status ab
   */
  async getTestStatus(testId: string): Promise<{ status: string; progress: number }> {
    return apiClient.get(`/tests/e2e/${testId}/status`)
  }
}

// Health Check für API Verfügbarkeit
export const healthService = {
  /**
   * Überprüft die API-Verfügbarkeit
   */
  async checkHealth(): Promise<{ status: string; version: string; uptime: number }> {
    return apiClient.get('/health')
  },

  /**
   * Ruft API-Metriken ab
   */
  async getMetrics(): Promise<any> {
    return apiClient.get('/health/metrics')
  }
}

// Exportiere den API Client für erweiterte Nutzung
export { apiClient }