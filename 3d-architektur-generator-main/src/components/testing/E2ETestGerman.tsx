import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileImage, 
  Cube, 
  Download,
  TestTube,
  Warning
} from '@phosphor-icons/react'
import { e2eTestBackend, standardE2ETestConfig, type TestExecutionResult } from '@/services/e2eTestBackend'

interface TestStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  duration?: number
  error?: string
}

interface E2ETestProps {
  onTestComplete?: (results: TestResults) => void
}

interface TestResults {
  totalSteps: number
  successfulSteps: number
  failedSteps: number
  totalDuration: number
  errors: string[]
}

export function E2ETest({ onTestComplete }: E2ETestProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestExecutionResult | null>(null)
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    {
      id: 'setup',
      name: 'Test-Umgebung einrichten',
      description: 'Initialisierung und Datenbereinigung',
      status: 'pending'
    },
    {
      id: 'upload',
      name: 'Blueprint-Upload',
      description: 'Test-Blueprint hochladen und validieren',
      status: 'pending'
    },
    {
      id: 'analysis',
      name: 'Blueprint-Analyse',
      description: 'KI-gestützte Analyse der Blueprint-Datei',
      status: 'pending'
    },
    {
      id: 'validation',
      name: 'Analyse-Validierung',
      description: 'Validierung der erkannten architektonischen Elemente',
      status: 'pending'
    },
    {
      id: '3d-generation',
      name: '3D-Modell-Generierung',
      description: 'Erstellung des 3D-Modells aus Blueprint-Daten',
      status: 'pending'
    },
    {
      id: '3d-validation',
      name: '3D-Modell-Validierung',
      description: 'Überprüfung der 3D-Modell-Integrität',
      status: 'pending'
    },
    {
      id: 'export',
      name: 'Export-Funktionalität',
      description: 'Test aller unterstützten Export-Formate',
      status: 'pending'
    },
    {
      id: 'cleanup',
      name: 'Bereinigung',
      description: 'Aufräumen der Test-Daten',
      status: 'pending'
    }
  ])

  const updateStepStatus = (stepId: string, status: TestStep['status'], duration?: number, error?: string) => {
    setTestSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, duration, error }
        : step
    ))
  }

  const runE2ETest = async () => {
    setIsRunning(true)
    setProgress(0)
    setCurrentStep(null)
    setTestResult(null)
    
    // Reset test steps
    setTestSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, duration: undefined, error: undefined })))

    try {
      // Starte Backend-Test
      const testId = await e2eTestBackend.startE2ETest(standardE2ETestConfig)
      
      // Überwache Test-Fortschritt
      const checkInterval = setInterval(async () => {
        const currentResult = e2eTestBackend.getTestStatus(testId)
        
        if (currentResult) {
          setTestResult(currentResult)
          
          // Aktualisiere UI basierend auf Backend-Ergebnissen
          currentResult.steps.forEach(backendStep => {
            const uiStep = testSteps.find(s => s.id === backendStep.stepId)
            if (uiStep) {
              updateStepStatus(
                backendStep.stepId,
                backendStep.status === 'success' ? 'success' :
                backendStep.status === 'error' ? 'error' :
                backendStep.status === 'running' ? 'running' : 'pending',
                backendStep.duration,
                backendStep.error?.message
              )
            }
          })
          
          // Berechne Fortschritt
          const completedSteps = currentResult.steps.filter(s => 
            s.status === 'success' || s.status === 'error' || s.status === 'skipped'
          ).length
          const newProgress = (completedSteps / currentResult.steps.length) * 100
          setProgress(newProgress)
          
          // Setze aktuellen Schritt
          const runningStep = currentResult.steps.find(s => s.status === 'running')
          setCurrentStep(runningStep?.stepId || null)
          
          // Prüfe ob Test abgeschlossen
          if (currentResult.status === 'completed' || currentResult.status === 'failed' || currentResult.status === 'cancelled') {
            clearInterval(checkInterval)
            setIsRunning(false)
            setCurrentStep(null)
            setProgress(100)
            
            // Konvertiere Backend-Ergebnisse für onTestComplete
            if (onTestComplete) {
              const testResults: TestResults = {
                totalSteps: currentResult.summary.totalSteps,
                successfulSteps: currentResult.summary.passedSteps,
                failedSteps: currentResult.summary.failedSteps,
                totalDuration: currentResult.duration || 0,
                errors: currentResult.errors.map(e => e.message)
              }
              onTestComplete(testResults)
            }
          }
        }
      }, 500) // Prüfe alle 500ms
      
    } catch (error) {
      console.error('E2E-Test-Start fehlgeschlagen:', error)
      setIsRunning(false)
      setCurrentStep(null)
      
      // Markiere alle Schritte als fehlgeschlagen
      setTestSteps(prev => prev.map(step => ({
        ...step,
        status: 'error' as const,
        error: `Test-Start fehlgeschlagen: ${error.message}`
      })))
    }
  }

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const completedSteps = testSteps.filter(step => step.status === 'success' || step.status === 'error').length
  const successfulSteps = testSteps.filter(step => step.status === 'success').length
  const failedSteps = testSteps.filter(step => step.status === 'error').length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          End-to-End Test Suite (Deutsch)
        </CardTitle>
        <CardDescription>
          Umfassender Test des kompletten Blueprint-zu-3D-Workflows mit deutschem Backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex items-center justify-between">
          <Button
            onClick={runE2ETest}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Tests laufen...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                E2E Test starten
              </>
            )}
          </Button>
          
          {completedSteps > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {successfulSteps} Bestanden
              </Badge>
              {failedSteps > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {failedSteps} Fehlgeschlagen
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Test-Fortschritt</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {currentStep && (
              <p className="text-sm text-muted-foreground">
                Läuft aktuell: {testSteps.find(s => s.id === currentStep)?.name}
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Test Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold">Test-Schritte</h3>
          <div className="space-y-2">
            {testSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  step.status === 'running' ? 'bg-primary/5 border-primary/20' :
                  step.status === 'success' ? 'bg-green-50 border-green-200' :
                  step.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{index + 1}. {step.name}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                    {step.error && (
                      <Alert className="mt-2">
                        <Warning className="h-4 w-4" />
                        <AlertDescription>{step.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                {step.duration && (
                  <Badge variant="outline" className="text-xs">
                    {step.duration}ms
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Summary */}
        {testResult && completedSteps === testSteps.length && (
          <div className="space-y-3">
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{testResult.summary.totalSteps}</div>
                <div className="text-sm text-muted-foreground">Gesamt Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{testResult.summary.passedSteps}</div>
                <div className="text-sm text-muted-foreground">Bestanden</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{testResult.summary.failedSteps}</div>
                <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {testResult.duration || 0}ms
                </div>
                <div className="text-sm text-muted-foreground">Gesamtzeit</div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            {testResult.performance && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">Performance-Metriken</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Durchschnittliche Antwortzeit</div>
                      <div className="text-muted-foreground">{testResult.performance.averageResponseTime.toFixed(2)}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Langsamster Schritt</div>
                      <div className="text-muted-foreground">{testResult.performance.slowestStep || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Schnellster Schritt</div>
                      <div className="text-muted-foreground">{testResult.performance.fastestStep || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Test Report Button */}
            {testResult && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const report = e2eTestBackend.generateTestReport(testResult.testId)
                    const blob = new Blob([report], { type: 'text/markdown' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `e2e-test-report-${testResult.testId}.md`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Test-Bericht herunterladen
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}