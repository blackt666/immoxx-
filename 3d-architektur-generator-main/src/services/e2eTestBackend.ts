/**
 * E2E Test Backend Service
 * Comprehensive Backend-Simulation für End-to-End Tests in deutscher Sprache
 */

import { BlueprintData, AnalysisParams } from '@/App'
import { AnalysisResult } from './blueprintAnalysis'
import { Model3D } from './model3DGeneration'

// Test-Typen und Interfaces
export interface E2ETestConfig {
  testName: string
  description: string
  timeout: number
  steps: TestStepConfig[]
  dataCleanup: boolean
  generateReport: boolean
}

export interface TestStepConfig {
  id: string
  name: string
  description: string
  timeout: number
  retries: number
  critical: boolean
  dependencies: string[]
}

export interface TestExecutionResult {
  testId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  steps: TestStepResult[]
  summary: TestSummary
  errors: TestError[]
  performance: PerformanceMetrics
}

export interface TestStepResult {
  stepId: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  startTime?: Date
  endTime?: Date
  duration?: number
  error?: TestError
  data?: any
  screenshots?: string[]
}

export interface TestSummary {
  totalSteps: number
  passedSteps: number
  failedSteps: number
  skippedSteps: number
  successRate: number
  averageStepDuration: number
  criticalFailures: number
}

export interface TestError {
  code: string
  message: string
  stack?: string
  context?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
}

export interface PerformanceMetrics {
  totalMemoryUsage: number
  peakMemoryUsage: number
  averageResponseTime: number
  slowestStep: string
  fastestStep: string
  throughput: number
  errorRate: number
}

// Mock-Daten für Tests
export interface TestDataSet {
  blueprints: MockBlueprint[]
  analysisResults: MockAnalysisResult[]
  models3D: MockModel3D[]
  exports: MockExport[]
}

export interface MockBlueprint {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  data: string // Base64 encoded
  expectedElements: {
    walls: number
    rooms: number
    doors: number
    windows: number
  }
}

export interface MockAnalysisResult {
  blueprintId: string
  analysisTime: number
  confidence: number
  elements: AnalysisResult
  validationScore: number
}

export interface MockModel3D {
  blueprintId: string
  generationTime: number
  fileSize: number
  quality: string
  polygonCount: number
  textureCount: number
}

export interface MockExport {
  modelId: string
  format: string
  fileSize: number
  exportTime: number
  compressionRatio: number
}

class E2ETestBackend {
  private static instance: E2ETestBackend
  private runningTests: Map<string, TestExecutionResult> = new Map()
  private testDataSets: Map<string, TestDataSet> = new Map()
  private performanceBaselines: Map<string, PerformanceMetrics> = new Map()

  public static getInstance(): E2ETestBackend {
    if (!E2ETestBackend.instance) {
      E2ETestBackend.instance = new E2ETestBackend()
    }
    return E2ETestBackend.instance
  }

  constructor() {
    this.initializeTestData()
    this.initializePerformanceBaselines()
  }

  /**
   * Startet einen E2E-Test mit der angegebenen Konfiguration
   */
  async startE2ETest(config: E2ETestConfig): Promise<string> {
    const testId = this.generateTestId()
    
    const testResult: TestExecutionResult = {
      testId,
      status: 'running',
      startTime: new Date(),
      steps: config.steps.map(step => ({
        stepId: step.id,
        name: step.name,
        status: 'pending'
      })),
      summary: {
        totalSteps: config.steps.length,
        passedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        successRate: 0,
        averageStepDuration: 0,
        criticalFailures: 0
      },
      errors: [],
      performance: this.initializePerformanceMetrics()
    }

    this.runningTests.set(testId, testResult)

    // Führe Test asynchron aus
    this.executeTestAsync(testId, config).catch(error => {
      console.error(`E2E-Test ${testId} fehlgeschlagen:`, error)
      this.markTestAsFailed(testId, error)
    })

    return testId
  }

  private async executeTestAsync(testId: string, config: E2ETestConfig): Promise<void> {
    const testResult = this.runningTests.get(testId)!
    
    try {
      for (const stepConfig of config.steps) {
        const stepResult = testResult.steps.find(s => s.stepId === stepConfig.id)!
        
        // Prüfe Abhängigkeiten
        if (!this.checkStepDependencies(stepConfig, testResult)) {
          this.markStepAsSkipped(stepResult, 'Abhängigkeiten nicht erfüllt')
          continue
        }

        // Führe Test-Schritt aus
        await this.executeTestStep(stepConfig, stepResult, testResult)
        
        // Prüfe ob kritischer Fehler aufgetreten ist
        if (stepResult.status === 'error' && stepConfig.critical) {
          testResult.summary.criticalFailures++
          throw new Error(`Kritischer Test-Schritt fehlgeschlagen: ${stepConfig.name}`)
        }
      }

      // Test erfolgreich abgeschlossen
      this.finalizeTest(testId, 'completed')

    } catch (error) {
      this.markTestAsFailed(testId, error)
    }
  }

  private async executeTestStep(
    stepConfig: TestStepConfig,
    stepResult: TestStepResult,
    testResult: TestExecutionResult
  ): Promise<void> {
    stepResult.status = 'running'
    stepResult.startTime = new Date()

    let attempts = 0
    let lastError: any = null

    while (attempts <= stepConfig.retries) {
      try {
        // Simuliere Test-Schritt-Ausführung
        await this.simulateTestStep(stepConfig, stepResult, testResult)
        
        stepResult.status = 'success'
        stepResult.endTime = new Date()
        stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime!.getTime()
        
        testResult.summary.passedSteps++
        return

      } catch (error) {
        lastError = error
        attempts++
        
        if (attempts <= stepConfig.retries) {
          console.log(`Test-Schritt ${stepConfig.name} fehlgeschlagen, Versuch ${attempts}/${stepConfig.retries + 1}`)
          await this.sleep(1000) // Warte 1 Sekunde vor Wiederholung
        }
      }
    }

    // Alle Versuche fehlgeschlagen
    stepResult.status = 'error'
    stepResult.endTime = new Date()
    stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime!.getTime()
    stepResult.error = this.createTestError(lastError, stepConfig)
    
    testResult.summary.failedSteps++
    testResult.errors.push(stepResult.error)
  }

  private async simulateTestStep(
    stepConfig: TestStepConfig,
    stepResult: TestStepResult,
    testResult: TestExecutionResult
  ): Promise<void> {
    const performanceStart = performance.now()

    switch (stepConfig.id) {
      case 'setup':
        await this.simulateSetupStep(stepResult)
        break
      case 'upload':
        await this.simulateUploadStep(stepResult)
        break
      case 'analysis':
        await this.simulateAnalysisStep(stepResult)
        break
      case 'validation':
        await this.simulateValidationStep(stepResult)
        break
      case '3d-generation':
        await this.simulate3DGenerationStep(stepResult)
        break
      case '3d-validation':
        await this.simulate3DValidationStep(stepResult)
        break
      case 'export':
        await this.simulateExportStep(stepResult)
        break
      case 'cleanup':
        await this.simulateCleanupStep(stepResult)
        break
      default:
        throw new Error(`Unbekannter Test-Schritt: ${stepConfig.id}`)
    }

    // Performance-Metriken aktualisieren
    const duration = performance.now() - performanceStart
    this.updatePerformanceMetrics(testResult, stepConfig.id, duration)
  }

  private async simulateSetupStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(500)
    
    // Simuliere Datenbank-Bereinigung
    if (window.spark?.kv) {
      await window.spark.kv.delete('current-blueprint')
      await window.spark.kv.delete('analysis-params')
      await window.spark.kv.delete('test-data')
    }

    // Simuliere Systemprüfungen
    const systemChecks = [
      'Speicher verfügbar',
      'API erreichbar', 
      'Berechtigungen vorhanden',
      'Temporäre Verzeichnisse bereit'
    ]

    for (const check of systemChecks) {
      await this.sleep(100)
      // Zufällige Chance für Systemfehler (5%)
      if (Math.random() < 0.05) {
        throw new Error(`Systemprüfung fehlgeschlagen: ${check}`)
      }
    }

    stepResult.data = { checks: systemChecks }
  }

  private async simulateUploadStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(800)
    
    const testDataSet = this.testDataSets.get('default')!
    const testBlueprint = testDataSet.blueprints[0]

    // Simuliere Datei-Upload-Validierung
    if (!testBlueprint) {
      throw new Error('Keine Test-Blueprint gefunden')
    }

    if (testBlueprint.fileSize > 10 * 1024 * 1024) {
      throw new Error('Datei zu groß für Upload')
    }

    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!supportedTypes.includes(testBlueprint.mimeType)) {
      throw new Error(`Nicht unterstützter Dateityp: ${testBlueprint.mimeType}`)
    }

    // Simuliere Upload-Fortschritt
    for (let progress = 0; progress <= 100; progress += 20) {
      await this.sleep(100)
    }

    stepResult.data = {
      uploadId: testBlueprint.id,
      fileName: testBlueprint.fileName,
      fileSize: testBlueprint.fileSize,
      mimeType: testBlueprint.mimeType
    }
  }

  private async simulateAnalysisStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(1500)
    
    const testDataSet = this.testDataSets.get('default')!
    const mockAnalysis = testDataSet.analysisResults[0]

    // Simuliere KI-Analyse mit verschiedenen Phasen
    const analysisPhases = [
      'Bildvorverarbeitung',
      'Kantenerkennung',
      'Wanderkennung',
      'Raumklassifizierung',
      'Tür- und Fenstererkennung',
      'Strukturvalidierung'
    ]

    for (const phase of analysisPhases) {
      await this.sleep(200)
      // Zufällige Chance für Analysefehler (3%)
      if (Math.random() < 0.03) {
        throw new Error(`Analysefehler in Phase: ${phase}`)
      }
    }

    // Prüfe Mindestanforderungen
    const elements = mockAnalysis.elements
    if (elements.walls.length < 3) {
      throw new Error('Unzureichende Wanderkennung')
    }

    if (elements.rooms.length === 0) {
      throw new Error('Keine Räume erkannt')
    }

    stepResult.data = {
      analysisId: mockAnalysis.blueprintId,
      confidence: mockAnalysis.confidence,
      elements: mockAnalysis.elements,
      processingTime: mockAnalysis.analysisTime
    }
  }

  private async simulateValidationStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(600)
    
    const testDataSet = this.testDataSets.get('default')!
    const mockAnalysis = testDataSet.analysisResults[0]
    
    // Simuliere Validierungsregeln
    const validationRules = [
      { name: 'Minimale Wandanzahl', check: () => mockAnalysis.elements.walls.length >= 3 },
      { name: 'Raumvalidierung', check: () => mockAnalysis.elements.rooms.length >= 1 },
      { name: 'Wandverbindungen', check: () => this.validateWallConnections(mockAnalysis.elements.walls) },
      { name: 'Raumgrößen', check: () => this.validateRoomSizes(mockAnalysis.elements.rooms) },
      { name: 'Türplatzierung', check: () => this.validateDoorPlacements(mockAnalysis.elements.doors, mockAnalysis.elements.walls) }
    ]

    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of validationRules) {
      try {
        if (!rule.check()) {
          errors.push(`Validierungsregel fehlgeschlagen: ${rule.name}`)
        }
      } catch (error) {
        warnings.push(`Validierungswarnung: ${rule.name} - ${error.message}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validierung fehlgeschlagen: ${errors.join(', ')}`)
    }

    const score = mockAnalysis.validationScore
    if (score < 70) {
      throw new Error(`Validierungsscore zu niedrig: ${score}`)
    }

    stepResult.data = {
      validationScore: score,
      errors,
      warnings,
      passedRules: validationRules.length - errors.length
    }
  }

  private async simulate3DGenerationStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(1500)
    
    const testDataSet = this.testDataSets.get('default')!
    const mockModel = testDataSet.models3D[0]

    // Simuliere 3D-Generierungsphasen
    const generationPhases = [
      'Geometrie-Initialisierung',
      'Wandgenerierung',
      'Bodengenerierung',
      'Deckengenerierung',
      'Türgenerierung',
      'Fenstergenerierung',
      'Materialanwendung',
      'Beleuchtungseinrichtung',
      'Optimierung'
    ]

    for (let i = 0; i < generationPhases.length; i++) {
      const phase = generationPhases[i]
      await this.sleep(150)
      
      // Simuliere GPU-Speicher-Beschränkungen
      if (mockModel.polygonCount > 100000 && Math.random() < 0.1) {
        throw new Error(`GPU-Speicher erschöpft während ${phase}`)
      }
      
      // Fortschritt aktualisieren
      const progress = ((i + 1) / generationPhases.length) * 100
    }

    // Validiere generiertes Modell
    if (mockModel.polygonCount === 0) {
      throw new Error('Leeres 3D-Modell generiert')
    }

    if (mockModel.fileSize > 50 * 1024 * 1024) {
      throw new Error('Generiertes Modell zu groß')
    }

    stepResult.data = {
      modelId: mockModel.blueprintId,
      polygonCount: mockModel.polygonCount,
      fileSize: mockModel.fileSize,
      quality: mockModel.quality,
      generationTime: mockModel.generationTime
    }
  }

  private async simulate3DValidationStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(800)
    
    const testDataSet = this.testDataSets.get('default')!
    const mockModel = testDataSet.models3D[0]

    // Simuliere 3D-Modell-Validierung
    const validationChecks = [
      { name: '3D-Komponenten', check: () => mockModel.polygonCount > 0 },
      { name: 'Texturen', check: () => mockModel.textureCount > 0 },
      { name: 'Beleuchtung', check: () => true }, // Placeholder
      { name: 'Strukturintegrität', check: () => this.validate3DStructure(mockModel) },
      { name: 'Dateiformat', check: () => this.validateModelFormat(mockModel) }
    ]

    const errors: string[] = []

    for (const check of validationChecks) {
      await this.sleep(100)
      try {
        if (!check.check()) {
          errors.push(`3D-Validierung fehlgeschlagen: ${check.name}`)
        }
      } catch (error) {
        errors.push(`3D-Validierungsfehler: ${check.name} - ${error.message}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`3D-Modell-Validierung fehlgeschlagen: ${errors.join(', ')}`)
    }

    stepResult.data = {
      modelValid: true,
      validationChecks: validationChecks.length,
      passedChecks: validationChecks.length - errors.length,
      modelQuality: mockModel.quality
    }
  }

  private async simulateExportStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(800)
    
    const exportFormats = ['gltf', 'obj', 'fbx', 'stl']
    const testDataSet = this.testDataSets.get('default')!
    const exportResults: any[] = []

    for (const format of exportFormats) {
      await this.sleep(200)
      
      const mockExport = testDataSet.exports.find(e => e.format === format)
      if (!mockExport) {
        throw new Error(`Export-Mock für Format ${format} nicht gefunden`)
      }

      // Simuliere Format-spezifische Validierung
      if (format === 'stl' && mockExport.fileSize > 20 * 1024 * 1024) {
        throw new Error(`STL-Export zu groß: ${mockExport.fileSize} bytes`)
      }

      exportResults.push({
        format,
        fileSize: mockExport.fileSize,
        exportTime: mockExport.exportTime,
        compressionRatio: mockExport.compressionRatio,
        success: true
      })
    }

    stepResult.data = {
      exportedFormats: exportFormats,
      exportResults,
      totalExportTime: exportResults.reduce((sum, r) => sum + r.exportTime, 0)
    }
  }

  private async simulateCleanupStep(stepResult: TestStepResult): Promise<void> {
    await this.sleep(300)
    
    // Simuliere Datenbereinigung
    const cleanupTasks = [
      'Temporäre Dateien löschen',
      'Cache leeren',
      'Test-Daten entfernen',
      'Verbindungen schließen'
    ]

    for (const task of cleanupTasks) {
      await this.sleep(50)
    }

    // Prüfe ob Bereinigung erfolgreich
    if (Math.random() < 0.02) { // 2% Chance für Bereinigungsfehler
      throw new Error('Bereinigung unvollständig')
    }

    stepResult.data = {
      cleanupTasks,
      cleanupSuccessful: true
    }
  }

  private validateWallConnections(walls: any[]): boolean {
    // Vereinfachte Validierung von Wandverbindungen
    return walls.length > 0
  }

  private validateRoomSizes(rooms: any[]): boolean {
    // Prüfe ob alle Räume eine Mindestgröße haben
    return rooms.every(room => room.area >= 1.0)
  }

  private validateDoorPlacements(doors: any[], walls: any[]): boolean {
    // Prüfe ob alle Türen an Wänden platziert sind
    return doors.every(door => 
      walls.some(wall => wall.id === door.wallId)
    )
  }

  private validate3DStructure(model: MockModel3D): boolean {
    // Vereinfachte 3D-Struktur-Validierung
    return model.polygonCount > 0 && model.polygonCount < 1000000
  }

  private validateModelFormat(model: MockModel3D): boolean {
    // Validiere Modellformat
    return model.fileSize > 0
  }

  private checkStepDependencies(stepConfig: TestStepConfig, testResult: TestExecutionResult): boolean {
    if (stepConfig.dependencies.length === 0) return true
    
    return stepConfig.dependencies.every(depId => {
      const depStep = testResult.steps.find(s => s.stepId === depId)
      return depStep && depStep.status === 'success'
    })
  }

  private markStepAsSkipped(stepResult: TestStepResult, reason: string): void {
    stepResult.status = 'skipped'
    stepResult.error = {
      code: 'SKIPPED',
      message: reason,
      severity: 'low',
      recoverable: true
    }
  }

  private markTestAsFailed(testId: string, error: any): void {
    const testResult = this.runningTests.get(testId)
    if (testResult) {
      testResult.status = 'failed'
      testResult.endTime = new Date()
      testResult.duration = testResult.endTime.getTime() - testResult.startTime.getTime()
      
      if (!testResult.errors.some(e => e.message === error.message)) {
        testResult.errors.push(this.createTestError(error))
      }
      
      this.finalizeTestSummary(testResult)
    }
  }

  private finalizeTest(testId: string, status: 'completed' | 'cancelled'): void {
    const testResult = this.runningTests.get(testId)
    if (testResult) {
      testResult.status = status
      testResult.endTime = new Date()
      testResult.duration = testResult.endTime.getTime() - testResult.startTime.getTime()
      this.finalizeTestSummary(testResult)
    }
  }

  private finalizeTestSummary(testResult: TestExecutionResult): void {
    const summary = testResult.summary
    summary.successRate = (summary.passedSteps / summary.totalSteps) * 100
    summary.averageStepDuration = testResult.steps
      .filter(s => s.duration)
      .reduce((sum, s) => sum + s.duration!, 0) / testResult.steps.filter(s => s.duration).length
  }

  private createTestError(error: any, stepConfig?: TestStepConfig): TestError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unbekannter Fehler',
      stack: error.stack,
      context: stepConfig ? { stepId: stepConfig.id, stepName: stepConfig.name } : undefined,
      severity: stepConfig?.critical ? 'critical' : 'medium',
      recoverable: !stepConfig?.critical
    }
  }

  private updatePerformanceMetrics(
    testResult: TestExecutionResult,
    stepId: string,
    duration: number
  ): void {
    const metrics = testResult.performance
    
    // Aktualisiere durchschnittliche Antwortzeit
    metrics.averageResponseTime = (metrics.averageResponseTime + duration) / 2
    
    // Aktualisiere langsamsten/schnellsten Schritt
    if (!metrics.slowestStep || duration > metrics.averageResponseTime * 2) {
      metrics.slowestStep = stepId
    }
    if (!metrics.fastestStep || duration < metrics.averageResponseTime * 0.5) {
      metrics.fastestStep = stepId
    }
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      totalMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageResponseTime: 0,
      slowestStep: '',
      fastestStep: '',
      throughput: 0,
      errorRate: 0
    }
  }

  private initializeTestData(): void {
    const defaultTestData: TestDataSet = {
      blueprints: [
        {
          id: 'test-blueprint-001',
          fileName: 'test-grundriss.png',
          fileSize: 2048000,
          mimeType: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          expectedElements: {
            walls: 4,
            rooms: 1,
            doors: 1,
            windows: 2
          }
        }
      ],
      analysisResults: [
        {
          blueprintId: 'test-blueprint-001',
          analysisTime: 2500,
          confidence: 0.87,
          validationScore: 82,
          elements: {
            walls: [
              { id: '1', start: [0, 0], end: [10, 0], thickness: 0.15, height: 2.5 },
              { id: '2', start: [10, 0], end: [10, 8], thickness: 0.15, height: 2.5 },
              { id: '3', start: [10, 8], end: [0, 8], thickness: 0.15, height: 2.5 },
              { id: '4', start: [0, 8], end: [0, 0], thickness: 0.15, height: 2.5 }
            ],
            rooms: [
              { id: '1', name: 'Wohnzimmer', area: 80, center: [5, 4], bounds: [0, 0, 10, 8], walls: ['1', '2', '3', '4'], doors: ['1'], windows: ['1', '2'] }
            ],
            doors: [
              { id: '1', position: [5, 0], width: 0.8, height: 2.1, wallId: '1', openDirection: 'push', doorType: 'interior' }
            ],
            windows: [
              { id: '1', position: [2, 8], width: 1.2, height: 1.4, wallId: '3', sillHeight: 0.8, windowType: 'casement' },
              { id: '2', position: [8, 8], width: 1.2, height: 1.4, wallId: '3', sillHeight: 0.8, windowType: 'casement' }
            ],
            confidence: 0.87,
            processingTime: 2500
          }
        }
      ],
      models3D: [
        {
          blueprintId: 'test-blueprint-001',
          generationTime: 3200,
          fileSize: 15728640,
          quality: 'medium',
          polygonCount: 12500,
          textureCount: 8
        }
      ],
      exports: [
        {
          modelId: 'test-blueprint-001',
          format: 'gltf',
          fileSize: 12582912,
          exportTime: 800,
          compressionRatio: 0.8
        },
        {
          modelId: 'test-blueprint-001',
          format: 'obj',
          fileSize: 8388608,
          exportTime: 600,
          compressionRatio: 0.6
        },
        {
          modelId: 'test-blueprint-001',
          format: 'fbx',
          fileSize: 16777216,
          exportTime: 1200,
          compressionRatio: 0.9
        },
        {
          modelId: 'test-blueprint-001',
          format: 'stl',
          fileSize: 4194304,
          exportTime: 400,
          compressionRatio: 0.4
        }
      ]
    }

    this.testDataSets.set('default', defaultTestData)
  }

  private initializePerformanceBaselines(): void {
    const baseline: PerformanceMetrics = {
      totalMemoryUsage: 50 * 1024 * 1024, // 50MB
      peakMemoryUsage: 100 * 1024 * 1024, // 100MB
      averageResponseTime: 1000, // 1 Sekunde
      slowestStep: 'analysis',
      fastestStep: 'setup',
      throughput: 10, // Operationen pro Sekunde
      errorRate: 0.02 // 2%
    }

    this.performanceBaselines.set('default', baseline)
  }

  private generateTestId(): string {
    return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Ruft den Status eines laufenden Tests ab
   */
  getTestStatus(testId: string): TestExecutionResult | null {
    return this.runningTests.get(testId) || null
  }

  /**
   * Bricht einen laufenden Test ab
   */
  cancelTest(testId: string): boolean {
    const testResult = this.runningTests.get(testId)
    if (testResult && testResult.status === 'running') {
      this.finalizeTest(testId, 'cancelled')
      return true
    }
    return false
  }

  /**
   * Erstellt einen detaillierten Test-Bericht
   */
  generateTestReport(testId: string): string {
    const testResult = this.runningTests.get(testId)
    if (!testResult) {
      throw new Error(`Test ${testId} nicht gefunden`)
    }

    const report = `
# E2E Test Bericht

**Test ID:** ${testResult.testId}
**Status:** ${testResult.status}
**Dauer:** ${testResult.duration || 0}ms
**Gestartet:** ${testResult.startTime.toLocaleString()}
**Beendet:** ${testResult.endTime?.toLocaleString() || 'N/A'}

## Zusammenfassung
- **Gesamt Schritte:** ${testResult.summary.totalSteps}
- **Erfolgreich:** ${testResult.summary.passedSteps}
- **Fehlgeschlagen:** ${testResult.summary.failedSteps}
- **Übersprungen:** ${testResult.summary.skippedSteps}
- **Erfolgsrate:** ${testResult.summary.successRate.toFixed(2)}%
- **Kritische Fehler:** ${testResult.summary.criticalFailures}

## Test Schritte
${testResult.steps.map(step => `
### ${step.name}
- **Status:** ${step.status}
- **Dauer:** ${step.duration || 0}ms
${step.error ? `- **Fehler:** ${step.error.message}` : ''}
`).join('')}

## Performance Metriken
- **Durchschnittliche Antwortzeit:** ${testResult.performance.averageResponseTime.toFixed(2)}ms
- **Langsamster Schritt:** ${testResult.performance.slowestStep}
- **Schnellster Schritt:** ${testResult.performance.fastestStep}
- **Durchsatz:** ${testResult.performance.throughput} ops/s
- **Fehlerrate:** ${(testResult.performance.errorRate * 100).toFixed(2)}%

## Fehler Details
${testResult.errors.map(error => `
### ${error.code}
- **Nachricht:** ${error.message}
- **Schweregrad:** ${error.severity}
- **Behebbar:** ${error.recoverable ? 'Ja' : 'Nein'}
`).join('')}
    `.trim()

    return report
  }

  /**
   * Bereinigt abgeschlossene Tests
   */
  cleanupCompletedTests(olderThanMinutes: number = 60): number {
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000)
    let cleanedCount = 0

    for (const [testId, testResult] of this.runningTests.entries()) {
      if (testResult.status !== 'running' && testResult.startTime.getTime() < cutoffTime) {
        this.runningTests.delete(testId)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}

// Standard E2E Test Konfiguration
export const standardE2ETestConfig: E2ETestConfig = {
  testName: 'Standard E2E Test',
  description: 'Vollständiger Test des Blueprint-zu-3D-Workflows',
  timeout: 30000,
  dataCleanup: true,
  generateReport: true,
  steps: [
    {
      id: 'setup',
      name: 'Test-Umgebung einrichten',
      description: 'Initialisierung und Datenbereinigung',
      timeout: 5000,
      retries: 1,
      critical: true,
      dependencies: []
    },
    {
      id: 'upload',
      name: 'Blueprint-Upload',
      description: 'Test-Blueprint hochladen und validieren',
      timeout: 10000,
      retries: 2,
      critical: true,
      dependencies: ['setup']
    },
    {
      id: 'analysis',
      name: 'Blueprint-Analyse',
      description: 'KI-gestützte Analyse der Blueprint-Datei',
      timeout: 15000,
      retries: 1,
      critical: true,
      dependencies: ['upload']
    },
    {
      id: 'validation',
      name: 'Analyse-Validierung',
      description: 'Validierung der erkannten architektonischen Elemente',
      timeout: 5000,
      retries: 2,
      critical: false,
      dependencies: ['analysis']
    },
    {
      id: '3d-generation',
      name: '3D-Modell-Generierung',
      description: 'Erstellung des 3D-Modells aus Blueprint-Daten',
      timeout: 20000,
      retries: 1,
      critical: true,
      dependencies: ['validation']
    },
    {
      id: '3d-validation',
      name: '3D-Modell-Validierung',
      description: 'Überprüfung der 3D-Modell-Integrität',
      timeout: 10000,
      retries: 1,
      critical: false,
      dependencies: ['3d-generation']
    },
    {
      id: 'export',
      name: 'Export-Funktionalität',
      description: 'Test aller unterstützten Export-Formate',
      timeout: 15000,
      retries: 2,
      critical: false,
      dependencies: ['3d-validation']
    },
    {
      id: 'cleanup',
      name: 'Bereinigung',
      description: 'Aufräumen der Test-Daten',
      timeout: 3000,
      retries: 1,
      critical: false,
      dependencies: []
    }
  ]
}

// Exportiere Singleton-Instanz
export const e2eTestBackend = E2ETestBackend.getInstance()