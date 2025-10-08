import { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileImage, CheckCircle, Warning } from '@phosphor-icons/react'

interface BlueprintUploadProps {
  onUpload: (file: File) => void
  isAnalyzing: boolean
  progress: number
}

export function BlueprintUpload({ onUpload, isAnalyzing, progress }: BlueprintUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    const maxSize = 16 * 1024 * 1024 // 16MB

    if (!validTypes.includes(file.type)) {
      return 'Bitte laden Sie eine PNG- oder JPEG-Bilddatei hoch'
    }

    if (file.size > maxSize) {
      return 'Dateigröße muss unter 16MB liegen'
    }

    return null
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const error = validateFile(file)

    if (error) {
      setUploadError(error)
      return
    }

    setUploadError(null)
    onUpload(file)
  }, [onUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [handleFiles])

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Bauplan wird analysiert
          </CardTitle>
          <CardDescription>
            Ihr Bauplan wird verarbeitet und architektonische Elemente werden erkannt...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-sm text-muted-foreground text-center">
            {progress < 30 && "Bilddaten werden gelesen..."}
            {progress >= 30 && progress < 60 && "Wände und Räume werden erkannt..."}
            {progress >= 60 && progress < 90 && "Türen und Fenster werden gefunden..."}
            {progress >= 90 && "Analyse wird abgeschlossen..."}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bauplan hochladen
        </CardTitle>
        <CardDescription>
          Laden Sie PNG- oder JPEG-Grundrisse bis zu 16MB für die 3D-Konvertierung hoch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileInput}
            disabled={isAnalyzing}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileImage className="h-6 w-6 text-primary" />
            </div>
            
            <div>
              <p className="text-sm font-medium">
                Ziehen Sie Ihren Bauplan hierher oder{' '}
                <span className="text-primary cursor-pointer hover:underline">
                  durchsuchen Sie Dateien
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unterstützt: PNG, JPEG (max 16MB)
              </p>
            </div>
          </div>
        </div>

        {uploadError && (
          <Alert className="mt-4" variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">Beispiel-Baupläne</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Hausplan', desc: 'Einstöckiges Haus' },
              { name: 'Wohnung', desc: '2-Zimmer Grundriss' },
              { name: 'Büro', desc: 'Gewerbefläche' }
            ].map((sample) => (
              <button
                key={sample.name}
                className="p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => {
                  // Simulate sample blueprint selection
                  const canvas = document.createElement('canvas')
                  canvas.width = 800
                  canvas.height = 600
                  const ctx = canvas.getContext('2d')!
                  ctx.fillStyle = '#ffffff'
                  ctx.fillRect(0, 0, 800, 600)
                  ctx.strokeStyle = '#000000'
                  ctx.lineWidth = 2
                  ctx.strokeRect(50, 50, 700, 500)
                  ctx.strokeRect(100, 100, 300, 200)
                  ctx.strokeRect(450, 100, 250, 200)
                  
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const file = new File([blob], `${sample.name.toLowerCase()}.png`, { type: 'image/png' })
                      onUpload(file)
                    }
                  })
                }}
              >
                <div className="text-xs font-medium">{sample.name}</div>
                <div className="text-xs text-muted-foreground">{sample.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}