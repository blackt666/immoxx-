
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function ImportManager() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<unknown[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    if (file.name.endsWith('.csv')) {
      // CSV Import
      Papa.parse(file, {
        complete: (results) => {
          setImportData(results.data);
          setIsImporting(false);
          toast({
            title: "CSV Import erfolgreich",
            description: `${results.data.length} Datensätze geladen`
          });
        },
        header: true,
        skipEmptyLines: true
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Excel Import
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        setIsImporting(false);
        toast({
          title: "Excel Import erfolgreich",
          description: `${jsonData.length} Datensätze geladen`
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processImport = async (type: 'properties' | 'customers' | 'inquiries') => {
    try {
      const response = await fetch(`/api/import/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: importData })
      });

      if (response.ok) {
        toast({
          title: "Import abgeschlossen",
          description: `${importData.length} ${type} erfolgreich importiert`
        });
        setImportData([]);
      }
    } catch (err) {
      console.error('Import fehler:', err);
      toast({
        title: "Import-Fehler",
        description: "Fehler beim Importieren der Daten",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = (type: string) => {
    const templates = {
      properties: [
        { title: 'Villa am See', price: 850000, size: 180, bedrooms: 4, location: 'Konstanz' },
        { title: 'Apartment Zentrum', price: 320000, size: 85, bedrooms: 2, location: 'Friedrichshafen' }
      ],
      customers: [
        { name: 'Max Mustermann', email: 'max@example.com', phone: '0171234567', type: 'buyer' },
        { name: 'Anna Schmidt', email: 'anna@example.com', phone: '0179876543', type: 'seller' }
      ]
    };

    const data = templates[type as keyof typeof templates] || [];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    XLSX.writeFile(workbook, `${type}_template.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Import Manager</h2>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Datei Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">CSV oder Excel Datei auswählen</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </div>

              {importData.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {importData.length} Datensätze geladen
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => processImport('properties')}
                      disabled={isImporting}
                    >
                      Als Immobilien importieren
                    </Button>
                    <Button 
                      onClick={() => processImport('customers')} 
                      variant="outline"
                      disabled={isImporting}
                    >
                      Als Kunden importieren
                    </Button>
                    <Button 
                      onClick={() => processImport('inquiries')} 
                      variant="outline"
                      disabled={isImporting}
                    >
                      Als Anfragen importieren
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Vorlagen herunterladen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => downloadTemplate('properties')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Immobilien Vorlage
                </Button>
                <Button onClick={() => downloadTemplate('customers')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Kunden Vorlage
                </Button>
                <Button onClick={() => downloadTemplate('inquiries')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Anfragen Vorlage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
