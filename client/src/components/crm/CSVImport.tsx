import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface ImportResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  imported: any[];
}

export function CSVImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Fehler',
          description: 'Bitte wählen Sie eine CSV-Datei',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Datei',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/crm/v2/import/csv', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast({
          title: 'Import erfolgreich',
          description: `${data.data.success} Leads importiert, ${data.data.failed} fehlgeschlagen`,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      toast({
        title: 'Import fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/crm/v2/import/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lead_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Template heruntergeladen',
        description: 'CSV-Template wurde erfolgreich heruntergeladen',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Template konnte nicht heruntergeladen werden',
        variant: 'destructive',
      });
    }
  };

  const exportLeads = async () => {
    try {
      const response = await fetch('/api/crm/v2/import/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export erfolgreich',
        description: 'Leads wurden erfolgreich exportiert',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Export fehlgeschlagen',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>
          CSV Import/Export
        </h2>
        <p className="text-gray-600 mt-1">Leads in großen Mengen importieren oder exportieren</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6" style={{ color: 'var(--bodensee-water)' }} />
            <h3 className="font-semibold">Template herunterladen</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Laden Sie eine CSV-Vorlage herunter, um Ihre Leads zu strukturieren
          </p>
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Template herunterladen
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6" style={{ color: 'var(--bodensee-water)' }} />
            <h3 className="font-semibold">Leads exportieren</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exportieren Sie alle vorhandenen Leads als CSV-Datei
          </p>
          <Button onClick={exportLeads} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Leads exportieren
          </Button>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-6 h-6" style={{ color: 'var(--bodensee-water)' }} />
          <h3 className="font-semibold">CSV-Datei hochladen</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Ausgewählt: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            style={{ backgroundColor: 'var(--bodensee-water)', color: 'white' }}
          >
            {uploading ? (
              <>Importiere...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Leads importieren
              </>
            )}
          </Button>

          {uploading && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">{progress}%</p>
            </div>
          )}
        </div>
      </Card>

      {/* Import Result */}
      {result && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Import-Ergebnis</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold">{result.total}</p>
              <p className="text-sm text-gray-600">Gesamt</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-gray-600">Erfolgreich</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-gray-600">Fehlgeschlagen</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Fehler bei {result.errors.length} Zeilen:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">Zeile {err.row}:</span> {err.error}
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-sm text-gray-500">
                        ... und {result.errors.length - 10} weitere Fehler
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--bodensee-deep)' }}>
          📋 Import-Anleitung
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>1. Laden Sie zuerst das CSV-Template herunter</li>
          <li>2. Füllen Sie die Spalten mit Ihren Lead-Daten aus</li>
          <li>3. Speichern Sie die Datei als CSV (UTF-8)</li>
          <li>4. Laden Sie die Datei hoch und starten Sie den Import</li>
        </ul>
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm font-semibold mb-2">Erforderliche Felder:</p>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• first_name (Vorname)</li>
            <li>• last_name (Nachname)</li>
            <li>• email (E-Mail-Adresse)</li>
          </ul>
          <p className="text-sm font-semibold mt-3 mb-2">Optionale Felder:</p>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• phone, company, budget_min, budget_max, property_type, preferred_location, timeline, notes</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
