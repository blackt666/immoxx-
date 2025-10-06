import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { z } from 'zod';
import { leadService } from '../../services/crm/leadService';
import { log } from '../../lib/logger.js';

const router = Router();

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// CSV lead schema
const csvLeadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  property_type: z.string().optional(),
  preferred_location: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().default('csv_import'),
});

interface ImportResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  imported: any[];
}

/**
 * POST /api/crm/import/csv
 * Import leads from CSV file
 */
router.post('/csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    log.info(`📤 Starting CSV import: ${req.file.originalname}`);

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers to match our schema
        return header.trim().toLowerCase().replace(/\s+/g, '_');
      },
    });

    if (parseResult.errors.length > 0) {
      log.error('CSV parsing errors:', parseResult.errors);
      return res.status(400).json({
        success: false,
        error: 'CSV parsing failed',
        details: parseResult.errors,
      });
    }

    const rows = parseResult.data;
    log.info(`📊 Parsed ${rows.length} rows from CSV`);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      total: rows.length,
      errors: [],
      imported: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        // Convert numeric fields
        if (row.budget_min) row.budget_min = parseFloat(row.budget_min);
        if (row.budget_max) row.budget_max = parseFloat(row.budget_max);

        // Validate row data
        const validatedData = csvLeadSchema.parse({
          first_name: row.first_name || row.firstname || row.vorname,
          last_name: row.last_name || row.lastname || row.nachname,
          email: row.email || row.e_mail,
          phone: row.phone || row.telefon || row.tel,
          company: row.company || row.firma || row.unternehmen,
          budget_min: row.budget_min || row.budget_von || row.min_budget,
          budget_max: row.budget_max || row.budget_bis || row.max_budget,
          property_type: row.property_type || row.immobilientyp || row.typ,
          preferred_location: row.preferred_location || row.location || row.standort || row.ort,
          timeline: row.timeline || row.zeitplan,
          notes: row.notes || row.notizen || row.bemerkungen,
          source: 'csv_import',
        });

        // Create lead
        const lead = await leadService.createLead(validatedData);
        result.success++;
        result.imported.push(lead);

        log.info(`✅ Imported lead ${rowNumber}: ${validatedData.first_name} ${validatedData.last_name}`);
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof z.ZodError 
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : error instanceof Error 
          ? error.message 
          : 'Unknown error';

        result.errors.push({
          row: rowNumber,
          error: errorMessage,
          data: row,
        });

        log.error(`❌ Failed to import row ${rowNumber}:`, errorMessage);
      }
    }

    log.info(`✅ CSV import completed: ${result.success} success, ${result.failed} failed`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    log.error('CSV import error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * GET /api/crm/import/template
 * Download CSV template
 */
router.get('/template', (req: Request, res: Response) => {
  const template = `first_name,last_name,email,phone,company,budget_min,budget_max,property_type,preferred_location,timeline,notes
Max,Mustermann,max@example.com,+49123456789,Musterfirma,500000,750000,Wohnung,Konstanz,3_months,Interessiert an Seenähe
Erika,Musterfrau,erika@example.com,+49987654321,,300000,450000,Haus,Friedrichshafen,6_months,Sucht Eigenheim mit Garten`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=lead_import_template.csv');
  res.send(template);
});

/**
 * GET /api/crm/import/export
 * Export all leads as CSV
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { data: leads } = await leadService.getLeads({});

    const csv = Papa.unparse(leads, {
      header: true,
      columns: [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company',
        'status',
        'pipeline_stage',
        'temperature',
        'score',
        'budget_min',
        'budget_max',
        'property_type',
        'preferred_location',
        'timeline',
        'source',
        'notes',
        'created_at',
      ],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.send(csv);
  } catch (error) {
    log.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
    });
  }
});

export default router;
