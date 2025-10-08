import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { storage } from '../storage.js';
import { z } from 'zod';
import { importUpload } from '../lib/multer-config.js';

const router = Router();

// Upload directory from multer config
const uploadDir = path.join(process.cwd(), 'uploads');

// Using shared multer configuration from lib/multer-config.ts

// Proper delimiter detection function
function detectDelimiterFromFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let sampleData = '';
    let bytesRead = 0;
    const maxSampleSize = 2048; // Read first 2KB for delimiter detection

    stream.on('data', (chunk: string) => {
      sampleData += chunk;
      bytesRead += Buffer.byteLength(chunk, 'utf8');
      
      if (bytesRead >= maxSampleSize) {
        stream.destroy();
        
        // Count occurrences of different delimiters
        const commaCount = (sampleData.match(/,/g) || []).length;
        const semicolonCount = (sampleData.match(/;/g) || []).length;
        const tabCount = (sampleData.match(/\t/g) || []).length;
        
        console.log(`🔍 Delimiter detection: comma=${commaCount}, semicolon=${semicolonCount}, tab=${tabCount}`);
        
        // Choose the most frequent delimiter
        if (semicolonCount > commaCount && semicolonCount > tabCount) {
          resolve(';');
        } else if (tabCount > commaCount && tabCount > semicolonCount) {
          resolve('\t');
        } else {
          resolve(','); // Default to comma
        }
      }
    });

    stream.on('end', () => {
      // If file is smaller than sample size, analyze what we have
      const commaCount = (sampleData.match(/,/g) || []).length;
      const semicolonCount = (sampleData.match(/;/g) || []).length;
      const tabCount = (sampleData.match(/\t/g) || []).length;
      
      if (semicolonCount > commaCount && semicolonCount > tabCount) {
        resolve(';');
      } else if (tabCount > commaCount && tabCount > semicolonCount) {
        resolve('\t');
      } else {
        resolve(',');
      }
    });

    stream.on('error', reject);
  });
}

// Properly fixed streaming CSV processor with correct Node.js stream flow
async function processCSVInBatches(
  filePath: string, 
  dataType: 'property' | 'customer',
  batchSize: number = 1000
): Promise<{ imported: number; errors: any[]; totalProcessed: number }> {
  // First, detect the delimiter
  const delimiter = await detectDelimiterFromFile(filePath);
  console.log(`📊 Using detected delimiter: '${delimiter}'`);
  
  return new Promise((resolve, reject) => {
    const errors: any[] = [];
    let imported = 0;
    let totalProcessed = 0;
    let batch: any[] = [];
    let isProcessing = false;
    
    // Create read stream
    const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    
    // Create Papa Parse transform stream - CORRECT way
    const papaStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for better control
    });
    
    // Handle data events from Papa Parse stream
    papaStream.on('data', async (row: any) => {
      try {
        // Pause stream for proper backpressure handling
        if (!isProcessing) {
          isProcessing = true;
          readStream.pause();
        }
        
        const mappedData = mapColumns(row, dataType);
        
        if (dataType === 'property') {
          const validatedData = propertyImportSchema.parse(mappedData);
          batch.push(validatedData);
        } else {
          const validatedData = customerImportSchema.parse(mappedData);
          batch.push(validatedData);
        }
        
        totalProcessed++;
        
        // Process batch when it reaches the batch size
        if (batch.length >= batchSize) {
          try {
            let result;
            if (dataType === 'property') {
              result = await storage.batchInsertProperties(batch);
            } else {
              result = await storage.batchInsertCustomers(batch);
            }
            
            imported += result.success;
            if (result.errors.length > 0) {
              errors.push(...result.errors);
            }
            
            console.log(`📈 Processed batch: ${imported}/${totalProcessed} imported successfully`);
          } catch (batchError) {
            errors.push({
              batch: Math.floor(totalProcessed / batchSize),
              error: batchError instanceof Error ? batchError.message : 'Batch processing failed'
            });
          }
          
          batch = [];
        }
        
        // Resume stream after processing
        isProcessing = false;
        readStream.resume();
        
      } catch (validationError) {
        errors.push({
          row: totalProcessed + 1,
          data: row,
          error: validationError instanceof Error ? validationError.message : 'Validation failed'
        });
        
        // Resume stream even on validation error
        if (isProcessing) {
          isProcessing = false;
          readStream.resume();
        }
      }
    });
    
    // Handle stream completion
    papaStream.on('end', async () => {
      try {
        console.log(`🏁 CSV parsing complete. Processing final batch of ${batch.length} items...`);
        
        // Process remaining items in the final batch
        if (batch.length > 0) {
          let result;
          if (dataType === 'property') {
            result = await storage.batchInsertProperties(batch);
          } else {
            result = await storage.batchInsertCustomers(batch);
          }
          
          imported += result.success;
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        }
        
        console.log(`✅ Final results: ${imported}/${totalProcessed} imported, ${errors.length} errors`);
        resolve({ imported, errors, totalProcessed });
      } catch (finalBatchError) {
        console.error('❌ Final batch processing failed:', finalBatchError);
        reject(finalBatchError);
      }
    });
    
    // Handle stream errors
    papaStream.on('error', (error: any) => {
      console.error('❌ Papa Parse stream error:', error);
      reject(error);
    });
    
    readStream.on('error', (error: any) => {
      console.error('❌ Read stream error:', error);
      reject(error);
    });
    
    // Pipe the read stream through Papa Parse
    readStream.pipe(papaStream);
  });
}

// Helper function to process CSV with specific delimiter
async function processCSVWithDelimiter(
  filePath: string,
  delimiter: string,
  dataType: 'property' | 'customer',
  batchSize: number = 1000
): Promise<{ imported: number; errors: any[]; totalProcessed: number }> {
  const csvData = fs.readFileSync(filePath, 'utf8');
  const parseResult = Papa.parse<Record<string, string>>(csvData, {
    header: true,
    skipEmptyLines: true,
    delimiter
  });

  const { data } = parseResult;
  const errors: any[] = [];
  let imported = 0;
  let totalProcessed = 0;

  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const validatedBatch: any[] = [];

    // Validate each item in the batch
    for (let j = 0; j < batch.length; j++) {
      try {
        const row = batch[j];
        const mappedData = mapColumns(row, dataType);
        
        if (dataType === 'property') {
          const validatedData = propertyImportSchema.parse(mappedData);
          validatedBatch.push(validatedData);
        } else {
          const validatedData = customerImportSchema.parse(mappedData);
          validatedBatch.push(validatedData);
        }
        
        totalProcessed++;
      } catch (validationError) {
        errors.push({
          row: i + j + 1,
          data: batch[j],
          error: validationError instanceof Error ? validationError.message : 'Validation failed'
        });
      }
    }

    // Batch insert validated data
    if (validatedBatch.length > 0) {
      try {
        let result;
        if (dataType === 'property') {
          result = await storage.batchInsertProperties(validatedBatch);
        } else {
          result = await storage.batchInsertCustomers(validatedBatch);
        }
        
        imported += result.success;
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }
      } catch (batchError) {
        errors.push({
          batch: Math.floor(i / batchSize),
          error: batchError instanceof Error ? batchError.message : 'Batch processing failed'
        });
      }
    }
  }

  return { imported, errors, totalProcessed };
}

// Safe number parsing function
function safeParseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  
  const str = String(value).trim();
  if (str === '') {
    return undefined;
  }
  
  // Remove common currency symbols and thousands separators
  const cleaned = str.replace(/[€$,\s]/g, '').replace(/\./g, '');
  const num = Number(cleaned);
  
  if (isNaN(num) || !isFinite(num)) {
    return undefined;
  }
  
  return num > 0 ? num : undefined;
}

// Safe integer parsing function
function safeParseInteger(value: unknown): number | undefined {
  const num = safeParseNumber(value);
  return num ? Math.floor(num) : undefined;
}

// Define import schemas for validation with better error handling
const propertyImportSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").transform(s => s.trim()),
  type: z.string().min(1, "Typ ist erforderlich").transform(s => s.trim().toLowerCase()),
  location: z.string().min(1, "Ort ist erforderlich").transform(s => s.trim()),
  description: z.string().optional().transform(s => s ? s.trim() : undefined),
  address: z.string().optional().transform(s => s ? s.trim() : undefined),
  price: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseNumber),
  area: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseInteger),
  rooms: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseInteger),
  bathrooms: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseInteger),
  bedrooms: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseInteger),
  condition: z.string().optional().transform(s => s ? s.trim() : undefined),
  status: z.string().optional().transform(s => {
    const status = s ? s.trim().toLowerCase() : 'available';
    return ['available', 'reserved', 'sold'].includes(status) ? status : 'available';
  }).default("available"),
}).transform((data) => ({
  ...data,
  features: [],
  images: []
}));

// Safe array parsing function
function safeParseArray(value: unknown): string[] {
  if (!value) return [];
  
  if (typeof value === 'string') {
    return value.split(/[,;]/).map(v => v.trim()).filter(v => v.length > 0);
  }
  
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(v => v.length > 0);
  }
  
  return [];
}

// Safe email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const customerImportSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").transform(s => s.trim()),
  email: z.string().min(1, "E-Mail ist erforderlich").refine(isValidEmail, {
    message: "Gültige E-Mail-Adresse erforderlich"
  }),
  phone: z.string().optional().transform(s => s ? s.trim() : undefined),
  type: z.string().optional().transform(s => {
    const type = s ? s.trim().toLowerCase() : 'lead';
    return ['lead', 'prospect', 'active_client', 'past_client'].includes(type) ? type : 'lead';
  }).default("lead"),
  source: z.string().optional().transform(s => s ? s.trim() : undefined),
  leadScore: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(val => {
    const score = safeParseInteger(val);
    if (score === undefined) return 50;
    return Math.max(0, Math.min(100, score));
  }).default(50),
  status: z.string().optional().transform(s => {
    const status = s ? s.trim().toLowerCase() : 'new';
    return ['new', 'contacted', 'qualified', 'interested', 'not_interested'].includes(status) ? status : 'new';
  }).default("new"),
  budgetMin: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseNumber),
  budgetMax: z.union([
    z.number(),
    z.string(),
    z.null(),
    z.undefined()
  ]).optional().transform(safeParseNumber),
  preferredLocations: z.unknown().optional().transform(safeParseArray),
  propertyTypes: z.unknown().optional().transform(safeParseArray),
  timeline: z.string().optional().transform(s => s ? s.trim() : undefined),
  address: z.string().optional().transform(s => s ? s.trim() : undefined),
  occupation: z.string().optional().transform(s => s ? s.trim() : undefined),
  company: z.string().optional().transform(s => s ? s.trim() : undefined),
  notes: z.string().optional().transform(s => s ? s.trim() : undefined),
}).transform((data) => ({
  ...data,
  budgetMin: data.budgetMin?.toString(),
  budgetMax: data.budgetMax?.toString(),
  tags: []
}));

// Utility function to normalize column headers
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // FIRST: Transliterate German characters
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // THEN: Remove non-alphanumeric characters
    .replace(/[^a-z0-9]/g, '');
}

// Utility function to translate German values to English with error handling
function translateGermanValues(value: string, field: string, dataType?: 'property' | 'customer'): string {
  if (!value || typeof value !== 'string') return value;
  
  try {
  
  const lowerValue = value.toLowerCase().trim();
  
  if (field === 'status') {
    // Property status translation
    const propertyStatusMap: {[key: string]: string} = {
      'verfügbar': 'available',
      'verfuegbar': 'available',
      'frei': 'available',
      'reserviert': 'reserved',
      'vorgemerkt': 'reserved',
      'verkauft': 'sold',
      'vermietet': 'sold',
      'belegt': 'sold',
      'available': 'available',
      'reserved': 'reserved',
      'sold': 'sold'
    };
    
    // Customer status translation
    const customerStatusMap: {[key: string]: string} = {
      'neu': 'new',
      'kontaktiert': 'contacted',
      'qualifiziert': 'qualified',
      'interessiert': 'interested',
      'nicht interessiert': 'not_interested',
      'nicht_interessiert': 'not_interested',
      'kein interesse': 'not_interested',
      'kein_interesse': 'not_interested',
      'new': 'new',
      'contacted': 'contacted',
      'qualified': 'qualified',
      'interested': 'interested',
      'not_interested': 'not_interested'
    };
    
    // Try customer status first if data type is customer, then property status
    if (dataType === 'customer' && customerStatusMap[lowerValue]) {
      return customerStatusMap[lowerValue];
    } else if (propertyStatusMap[lowerValue]) {
      return propertyStatusMap[lowerValue];
    } else if (customerStatusMap[lowerValue]) {
      return customerStatusMap[lowerValue];
    }
    
    return value;
  }
  
  if (field === 'type') {
    // Customer type translation
    const customerTypeMap: {[key: string]: string} = {
      'lead': 'lead',
      'interessent': 'prospect',
      'interessentin': 'prospect',
      'potentieller kunde': 'prospect',
      'potentielle kundin': 'prospect',
      'bestandskunde': 'active_client',
      'bestandskundin': 'active_client',
      'aktiver kunde': 'active_client',
      'aktive kundin': 'active_client',
      'ehemaliger kunde': 'past_client',
      'ehemalige kundin': 'past_client',
      'früherer kunde': 'past_client',
      'frühere kundin': 'past_client',
      'prospect': 'prospect',
      'active_client': 'active_client',
      'past_client': 'past_client'
    };
    
    // Property type translation
    const propertyTypeMap: {[key: string]: string} = {
      'wohnung': 'apartment',
      'haus': 'house',
      'einfamilienhaus': 'house',
      'doppelhaushälfte': 'house',
      'mehrfamilienhaus': 'house',
      'villa': 'villa',
      'penthouse': 'penthouse',
      'grundstück': 'land',
      'grundstueck': 'land',
      'gewerbe': 'commercial',
      'büro': 'office',
      'buero': 'office',
      'apartment': 'apartment',
      'house': 'house',
      'commercial': 'commercial',
      'office': 'office',
      'land': 'land'
    };
    
    // Try customer type first if data type is customer, then property type
    if (dataType === 'customer' && customerTypeMap[lowerValue]) {
      return customerTypeMap[lowerValue];
    } else if (propertyTypeMap[lowerValue]) {
      return propertyTypeMap[lowerValue];
    } else if (customerTypeMap[lowerValue]) {
      return customerTypeMap[lowerValue];
    }
    
    return value;
  }
  
  return value;
  } catch (error) {
    console.warn(`Error translating value "${value}" for field "${field}":`, error);
    return value;
  }
}

// Utility function to process array fields
function processArrayFields(value: any, field: string): string[] | any {
  if (!value) return field === 'preferredLocations' || field === 'propertyTypes' ? [] : value;
  
  if (['preferredLocations', 'propertyTypes'].includes(field)) {
    if (typeof value === 'string') {
      return value.split(/[,;]/).map(v => v.trim()).filter(v => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value;
    }
  }
  
  return value;
}

// Utility function to auto-detect CSV delimiter
function detectCSVDelimiter(csvData: string): string {
  const sampleLines = csvData.split('\n').slice(0, 5).join('\n');
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let bestDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const count = (sampleLines.match(new RegExp('\\' + delimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

// Utility function to map columns flexibly
function mapColumns(row: any, type: 'property' | 'customer'): any {
  const mapped: any = {};
  
  // Property column mappings
  if (type === 'property') {
    const propertyMappings = {
      title: ['title', 'titel', 'name', 'objekttitel', 'immobilientitel'],
      type: ['type', 'typ', 'art', 'immobilienart', 'objektart'],
      location: ['location', 'ort', 'standort', 'lage', 'stadt'],
      description: ['description', 'beschreibung', 'details', 'objektbeschreibung'],
      address: ['address', 'adresse', 'strasse', 'hausnummer'],
      price: ['price', 'preis', 'kaufpreis', 'mietpreis', 'kosten'],
      area: ['area', 'flaeche', 'groesse', 'wohnflaeche', 'qm'],
      rooms: ['rooms', 'zimmer', 'raeume', 'anzahlzimmer'],
      bathrooms: ['bathrooms', 'baeder', 'badezimmer', 'bad'],
      bedrooms: ['bedrooms', 'schlafzimmer', 'anzahlschlafzimmer'],
      condition: ['condition', 'zustand', 'baujahr', 'renovierung'],
      status: ['status', 'verfuegbarkeit', 'verkaufsstatus']
    };

    for (const [targetKey, possibleKeys] of Object.entries(propertyMappings)) {
      for (const key of Object.keys(row)) {
        const normalizedKey = normalizeColumnName(key);
        if (possibleKeys.some(pk => normalizedKey.includes(pk))) {
          let value = row[key];
          
          // Apply German value translation
          if (targetKey === 'status' || targetKey === 'type') {
            value = translateGermanValues(value, targetKey, 'property');
          }
          
          mapped[targetKey] = value;
          break;
        }
      }
    }
  }

  // Customer column mappings
  if (type === 'customer') {
    const customerMappings = {
      name: ['name', 'vollname', 'kunde', 'nachname', 'vorname'],
      email: ['email', 'emailadresse', 'mailadresse', 'kontakt'],
      phone: ['phone', 'telefon', 'handy', 'mobilnummer', 'kontaktnummer'],
      type: ['type', 'typ', 'kundentyp', 'kategorie'],
      source: ['source', 'quelle', 'herkunft', 'akquisition'],
      leadScore: ['leadscore', 'bewertung', 'score', 'punkte'],
      status: ['status', 'kundenstatus', 'bearbeitungsstatus'],
      budgetMin: ['budgetmin', 'minbudget', 'preisvorstellungmin'],
      budgetMax: ['budgetmax', 'maxbudget', 'preisvorstellungmax'],
      preferredLocations: ['preferredlocations', 'bevorzugteorte', 'wunschorte', 'standorte'],
      propertyTypes: ['propertytypes', 'immobilientypen', 'objektarten', 'wunschtypen'],
      timeline: ['timeline', 'zeitplan', 'zeithorizont', 'wann'],
      address: ['address', 'adresse', 'wohnort', 'anschrift'],
      occupation: ['occupation', 'beruf', 'taetigkeit', 'job'],
      company: ['company', 'firma', 'unternehmen', 'arbeitgeber'],
      notes: ['notes', 'notizen', 'bemerkungen', 'anmerkungen']
    };

    for (const [targetKey, possibleKeys] of Object.entries(customerMappings)) {
      for (const key of Object.keys(row)) {
        const normalizedKey = normalizeColumnName(key);
        if (possibleKeys.some(pk => normalizedKey.includes(pk))) {
          let value = row[key];
          
          // Apply German value translation
          if (targetKey === 'status' || targetKey === 'type') {
            value = translateGermanValues(value, targetKey, 'customer');
          }
          
          // Process array fields
          if (targetKey === 'preferredLocations' || targetKey === 'propertyTypes') {
            value = processArrayFields(value, targetKey);
          }
          
          mapped[targetKey] = value;
          break;
        }
      }
    }
  }

  return mapped;
}

// Enhanced CSV Import endpoint with streaming
router.post('/csv', importUpload.single('file'), async (req, res) => {
  try {
    console.log('📤 CSV Import request received');

    if (!req.file) {
      return res.status(400).json({ error: "Keine Datei hochgeladen" });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const fileSize = req.file.size;
    console.log(`📁 Processing file: ${req.file.filename} (${Math.round(fileSize / 1024 / 1024)}MB)`);

    // Auto-detect data type by reading a small sample
    const sampleData = fs.readFileSync(filePath, { encoding: 'utf8' }).slice(0, 1000);
    const delimiter = detectCSVDelimiter(sampleData);
    console.log(`🔍 Detected CSV delimiter: '${delimiter}'`);
    
    const sampleParseResult = Papa.parse<Record<string, string>>(sampleData, {
      header: true,
      skipEmptyLines: true,
      delimiter
    });

    if (sampleParseResult.errors && sampleParseResult.errors.length > 0) {
      console.error('CSV parsing errors:', sampleParseResult.errors);
      fs.unlinkSync(filePath); // Clean up
      return res.status(400).json({ 
        error: "CSV-Datei konnte nicht verarbeitet werden",
        details: sampleParseResult.errors
      });
    }

    // Auto-detect data type based on columns
    const firstRow = sampleParseResult.data[0];
    const hasPropertyColumns = firstRow && (
      Object.keys(firstRow).some(key => 
        ['title', 'titel', 'type', 'typ', 'location', 'ort'].includes(key.toLowerCase())
      )
    );

    const dataType = hasPropertyColumns ? 'property' : 'customer';
    console.log(`🔍 Auto-detected data type: ${dataType}`);

    // Use streaming processing for larger files or batch processing for smaller ones
    const useStreaming = fileSize > 10 * 1024 * 1024; // 10MB threshold
    let result;

    if (useStreaming) {
      console.log('🌊 Using streaming processing for large file');
      result = await processCSVInBatches(filePath, dataType, 1000);
    } else {
      console.log('📦 Using batch processing for smaller file');
      result = await processCSVWithDelimiter(filePath, delimiter, dataType, 500);
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log(`✅ CSV Import completed: ${result.imported} imported, ${result.errors.length} errors, ${result.totalProcessed} total processed`);

    res.json({
      imported: result.imported,
      errors: result.errors,
      totalProcessed: result.totalProcessed,
      dataType,
      processingMethod: useStreaming ? 'streaming' : 'batch',
      message: `${result.imported} ${dataType === 'property' ? 'Immobilien' : 'Kunden'} erfolgreich importiert`
    });

  } catch (error) {
    console.error('❌ CSV Import error:', error);
    
    // Clean up file on error
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      error: "CSV Import fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Excel Import endpoint
router.post('/excel', importUpload.single('file'), async (req, res) => {
  try {
    console.log('📤 Excel Import request received');

    if (!req.file) {
      return res.status(400).json({ error: "Keine Datei hochgeladen" });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return res.status(400).json({ error: "Excel-Datei enthält keine Daten" });
    }

    // Convert to object format using first row as headers
    const headers = data[0] as string[];
    const rows = data.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = (row as any[])[index] || '';
      });
      return obj;
    });

    console.log(`📊 Parsed ${rows.length} rows from Excel`);

    // Auto-detect data type
    const firstRow = rows[0];
    const hasPropertyColumns = firstRow && (
      Object.keys(firstRow).some(key => 
        normalizeColumnName(key).includes('title') || 
        normalizeColumnName(key).includes('titel') ||
        normalizeColumnName(key).includes('type') || 
        normalizeColumnName(key).includes('typ')
      )
    );

    const dataType = hasPropertyColumns ? 'property' : 'customer';
    console.log(`🔍 Auto-detected data type: ${dataType}`);

    let imported = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const mappedData = mapColumns(row, dataType);

        if (dataType === 'property') {
          const validatedData = propertyImportSchema.parse(mappedData);
          await storage.createProperty(validatedData);
        } else {
          const validatedData = customerImportSchema.parse(mappedData);
          await storage.createCustomer(validatedData);
        }

        imported++;
      } catch (error) {
        console.error(`Row ${i + 1} error:`, error);
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log(`✅ Excel Import completed: ${imported} imported, ${errors.length} errors`);

    res.json({
      imported,
      errors,
      dataType,
      message: `${imported} ${dataType === 'property' ? 'Immobilien' : 'Kunden'} aus Excel erfolgreich importiert`
    });

  } catch (error) {
    console.error('❌ Excel Import error:', error);
    res.status(500).json({
      error: "Excel Import fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

// Google Sheets Import endpoint
router.post('/google-sheets', async (req, res) => {
  try {
    console.log('📤 Google Sheets Import request received');

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Google Sheets URL ist erforderlich" });
    }

    // Extract sheet ID from URL
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      return res.status(400).json({ error: "Ungültige Google Sheets URL" });
    }

    const sheetId = sheetIdMatch[1];
    console.log(`🔗 Processing Google Sheet ID: ${sheetId}`);

    // Create a public CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    // Fetch CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(400).json({ 
        error: "Google Sheets Daten konnten nicht abgerufen werden",
        details: "Stellen Sie sicher, dass das Sheet öffentlich freigegeben ist"
      });
    }

    const csvData = await response.text();

    // Auto-detect delimiter and parse CSV data
    const delimiter = detectCSVDelimiter(csvData);
    console.log(`🔍 Detected CSV delimiter: '${delimiter}'`);
    
    const parseResult = Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true,
      delimiter
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      return res.status(400).json({ 
        error: "Google Sheets Daten konnten nicht verarbeitet werden",
        details: parseResult.errors
      });
    }

    const { data } = parseResult;
    console.log(`📊 Parsed ${data.length} rows from Google Sheets`);

    // Auto-detect data type
    const firstRow = data[0];
    const hasPropertyColumns = firstRow && (
      'title' in firstRow || 'titel' in firstRow || 
      'type' in firstRow || 'typ' in firstRow ||
      'location' in firstRow || 'ort' in firstRow
    );

    const dataType = hasPropertyColumns ? 'property' : 'customer';
    console.log(`🔍 Auto-detected data type: ${dataType}`);

    let imported = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const mappedData = mapColumns(row, dataType);

        if (dataType === 'property') {
          const validatedData = propertyImportSchema.parse(mappedData);
          await storage.createProperty(validatedData);
        } else {
          const validatedData = customerImportSchema.parse(mappedData);
          await storage.createCustomer(validatedData);
        }

        imported++;
      } catch (error) {
        console.error(`Row ${i + 1} error:`, error);
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }

    console.log(`✅ Google Sheets Import completed: ${imported} imported, ${errors.length} errors`);

    res.json({
      imported,
      errors,
      dataType,
      message: `${imported} ${dataType === 'property' ? 'Immobilien' : 'Kunden'} aus Google Sheets erfolgreich importiert`
    });

  } catch (error) {
    console.error('❌ Google Sheets Import error:', error);
    res.status(500).json({
      error: "Google Sheets Import fehlgeschlagen",
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;