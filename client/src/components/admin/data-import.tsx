
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download, Database } from 'lucide-react';

export default function DataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const { toast } = useToast();

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'csv');

    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Import erfolgreich',
          description: `${result.imported} Datensätze importiert`,
        });
      } else {
        throw new Error('Import fehlgeschlagen');
      }
    } catch {
      toast({
        title: 'Import Fehler',
        description: 'Datei konnte nicht importiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'excel');

    try {
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Excel Import erfolgreich',
          description: `${result.imported} Datensätze aus Excel importiert`,
        });
      } else {
        throw new Error('Excel Import fehlgeschlagen');
      }
    } catch {
      toast({
        title: 'Excel Import Fehler',
        description: 'Excel-Datei konnte nicht importiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetUrl) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine Google Sheets URL ein',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleSheetUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Google Sheets Import erfolgreich',
          description: `${result.imported} Datensätze importiert`,
        });
      } else {
        throw new Error('Google Sheets Import fehlgeschlagen');
      }
    } catch {
      toast({
        title: 'Google Sheets Import Fehler',
        description: 'Daten konnten nicht von Google Sheets importiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daten Import</h1>
          <p className="text-muted-foreground">
            Importieren Sie Daten aus verschiedenen Quellen
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* CSV Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              CSV Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importieren Sie Immobilien- oder Kundendaten aus CSV-Dateien
            </p>
            <div>
              <Label htmlFor="csv-file">CSV-Datei auswählen</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={isImporting}
                className="mt-2"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/api/templates/csv-template.csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV Vorlage
            </Button>
          </CardContent>
        </Card>

        {/* Excel Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Excel Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importieren Sie Daten aus Excel-Dateien (.xlsx)
            </p>
            <div>
              <Label htmlFor="excel-file">Excel-Datei auswählen</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                disabled={isImporting}
                className="mt-2"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/api/templates/excel-template.xlsx')}
            >
              <Download className="w-4 h-4 mr-2" />
              Excel Vorlage
            </Button>
          </CardContent>
        </Card>

        {/* Google Sheets Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importieren Sie Daten direkt aus Google Sheets
            </p>
            <div>
              <Label htmlFor="sheets-url">Google Sheets URL</Label>
              <Input
                id="sheets-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                disabled={isImporting}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleGoogleSheetsImport}
              disabled={isImporting || !googleSheetUrl}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importiere...' : 'Importieren'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
