import { Router } from 'express';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const router = Router();

// Property template data
const propertyTemplateData = [
  {
    title: 'Moderne Villa am Bodensee',
    type: 'Villa',
    location: 'Meersburg',
    description: 'Exklusive Villa mit Seeblick und modernen Annehmlichkeiten',
    address: 'Seestraße 123, 88709 Meersburg',
    price: '850000',
    area: '180',
    rooms: '5',
    bathrooms: '3',
    bedrooms: '4',
    condition: 'Neuwertig',
    status: 'available'
  },
  {
    title: 'Gemütliche Wohnung in Konstanz',
    type: 'Wohnung', 
    location: 'Konstanz',
    description: 'Schöne 3-Zimmer-Wohnung in zentraler Lage',
    address: 'Hauptstraße 45, 78462 Konstanz',
    price: '320000',
    area: '95',
    rooms: '3',
    bathrooms: '1',
    bedrooms: '2',
    condition: 'Gut',
    status: 'available'
  }
];

// Customer template data
const customerTemplateData = [
  {
    name: 'Max Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 7541 123456',
    type: 'lead',
    source: 'website',
    leadScore: '75',
    status: 'new',
    budgetMin: '300000',
    budgetMax: '500000',
    preferredLocations: 'Konstanz, Friedrichshafen',
    propertyTypes: 'Wohnung, Haus',
    timeline: '3_months',
    address: 'Musterstraße 1, 78462 Konstanz',
    occupation: 'Ingenieur',
    company: 'Tech AG',
    notes: 'Interessiert an Immobilien mit Seeblick'
  },
  {
    name: 'Anna Schmidt',
    email: 'anna.schmidt@example.com',
    phone: '+49 7541 789012',
    type: 'prospect',
    source: 'referral',
    leadScore: '85',
    status: 'contacted',
    budgetMin: '600000',
    budgetMax: '800000',
    preferredLocations: 'Meersburg, Überlingen',
    propertyTypes: 'Villa, Einfamilienhaus',
    timeline: '6_months',
    address: 'Beispielweg 22, 88709 Meersburg',
    occupation: 'Ärztin',
    company: 'Klinik Bodensee',
    notes: 'Sucht Familienhaus mit Garten'
  }
];

// CSV Template for Properties
router.get('/csv-template.csv', (req, res) => {
  try {
    console.log('📥 CSV Template requested');

    // Create CSV with both property and customer sections
    const propertyHeaders = Object.keys(propertyTemplateData[0]);
    const customerHeaders = Object.keys(customerTemplateData[0]);

    // Generate property CSV
    const propertyCsv = Papa.unparse({
      fields: propertyHeaders,
      data: propertyTemplateData
    });

    // Generate customer CSV  
    const customerCsv = Papa.unparse({
      fields: customerHeaders,
      data: customerTemplateData
    });

    // Combine with section headers
    const combinedCsv = [
      '# IMMOBILIEN VORLAGE',
      '# Folgende Spalten sind für Immobilien verfügbar:',
      '# title, type, location, description, address, price, area, rooms, bathrooms, bedrooms, condition, status',
      '',
      propertyCsv,
      '',
      '',
      '# KUNDEN VORLAGE',
      '# Folgende Spalten sind für Kunden verfügbar:',
      '# name, email, phone, type, source, leadScore, status, budgetMin, budgetMax, preferredLocations, propertyTypes, timeline, address, occupation, company, notes',
      '',
      customerCsv
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bodensee-immobilien-vorlage.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Add BOM for proper UTF-8 encoding in Excel
    res.send('\ufeff' + combinedCsv);

    console.log('✅ CSV Template sent successfully');
  } catch (error) {
    console.error('❌ CSV Template error:', error);
    res.status(500).json({ error: 'Template konnte nicht generiert werden' });
  }
});

// Excel Template for Properties and Customers
router.get('/excel-template.xlsx', (req, res) => {
  try {
    console.log('📥 Excel Template requested');

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create Property worksheet
    const propertyWorksheet = XLSX.utils.json_to_sheet(propertyTemplateData);
    
    // Set column widths for property sheet
    const propertyColumnWidths = [
      { wch: 30 }, // title
      { wch: 15 }, // type
      { wch: 15 }, // location
      { wch: 40 }, // description
      { wch: 30 }, // address
      { wch: 12 }, // price
      { wch: 8 },  // area
      { wch: 8 },  // rooms
      { wch: 10 }, // bathrooms
      { wch: 10 }, // bedrooms
      { wch: 12 }, // condition
      { wch: 12 }  // status
    ];
    propertyWorksheet['!cols'] = propertyColumnWidths;

    // Add property sheet to workbook
    XLSX.utils.book_append_sheet(workbook, propertyWorksheet, 'Immobilien');

    // Create Customer worksheet
    const customerWorksheet = XLSX.utils.json_to_sheet(customerTemplateData);
    
    // Set column widths for customer sheet
    const customerColumnWidths = [
      { wch: 20 }, // name
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 12 }, // type
      { wch: 12 }, // source
      { wch: 10 }, // leadScore
      { wch: 12 }, // status
      { wch: 12 }, // budgetMin
      { wch: 12 }, // budgetMax
      { wch: 20 }, // preferredLocations
      { wch: 20 }, // propertyTypes
      { wch: 12 }, // timeline
      { wch: 25 }, // address
      { wch: 15 }, // occupation
      { wch: 20 }, // company
      { wch: 30 }  // notes
    ];
    customerWorksheet['!cols'] = customerColumnWidths;

    // Add customer sheet to workbook
    XLSX.utils.book_append_sheet(workbook, customerWorksheet, 'Kunden');

    // Create Instructions worksheet
    const instructions = [
      ['Bodensee Immobilien Müller - Import Vorlage'],
      [''],
      ['ANWEISUNGEN:'],
      ['1. Wählen Sie das entsprechende Arbeitsblatt (Immobilien oder Kunden)'],
      ['2. Ersetzen Sie die Beispieldaten durch Ihre echten Daten'],
      ['3. Lassen Sie die Spaltenüberschriften unverändert'],
      ['4. Speichern Sie die Datei und laden Sie sie im Admin-Bereich hoch'],
      [''],
      ['IMMOBILIEN SPALTEN:'],
      ['title - Titel der Immobilie (erforderlich)'],
      ['type - Art der Immobilie: Villa, Wohnung, Haus, Grundstück (erforderlich)'],
      ['location - Standort: Konstanz, Friedrichshafen, Meersburg, etc. (erforderlich)'],
      ['description - Beschreibung der Immobilie'],
      ['address - Vollständige Adresse'],
      ['price - Preis in Euro (nur Zahlen)'],
      ['area - Wohnfläche in m² (nur Zahlen)'],
      ['rooms - Anzahl Zimmer (nur Zahlen)'],
      ['bathrooms - Anzahl Badezimmer (nur Zahlen)'],
      ['bedrooms - Anzahl Schlafzimmer (nur Zahlen)'],
      ['condition - Zustand: Neuwertig, Sehr gut, Gut, Durchschnittlich, Renovierungsbedürftig'],
      ['status - Verfügbarkeit: available, reserved, sold'],
      [''],
      ['KUNDEN SPALTEN:'],
      ['name - Vollständiger Name (erforderlich)'],
      ['email - E-Mail-Adresse (erforderlich)'],
      ['phone - Telefonnummer'],
      ['type - Kundentyp: lead, prospect, active_client, past_client'],
      ['source - Quelle: website, referral, social, advertising, direct'],
      ['leadScore - Bewertung 0-100 (nur Zahlen)'],
      ['status - Status: new, contacted, qualified, interested, not_interested'],
      ['budgetMin - Mindestbudget in Euro (nur Zahlen)'],
      ['budgetMax - Höchstbudget in Euro (nur Zahlen)'],
      ['preferredLocations - Bevorzugte Orte (mit Komma getrennt)'],
      ['propertyTypes - Gewünschte Immobilienarten (mit Komma getrennt)'],
      ['timeline - Zeitrahmen: immediate, 3_months, 6_months, 1_year, flexible'],
      ['address - Adresse des Kunden'],
      ['occupation - Beruf'],
      ['company - Firma/Arbeitgeber'],
      ['notes - Notizen und Bemerkungen']
    ];

    const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsWorksheet['!cols'] = [{ wch: 80 }]; // Wide column for instructions
    
    // Add instructions as first sheet
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Anweisungen');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: true 
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bodensee-immobilien-vorlage.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Length', excelBuffer.length.toString());

    res.send(excelBuffer);

    console.log('✅ Excel Template sent successfully');
  } catch (error) {
    console.error('❌ Excel Template error:', error);
    res.status(500).json({ error: 'Excel Template konnte nicht generiert werden' });
  }
});

// Get template information
router.get('/info', (req, res) => {
  try {
    res.json({
      templates: [
        {
          type: 'csv',
          name: 'CSV Vorlage',
          description: 'Kombinierte Vorlage für Immobilien und Kunden im CSV-Format',
          url: '/api/templates/csv-template.csv',
          fileSize: 'ca. 2 KB'
        },
        {
          type: 'excel',
          name: 'Excel Vorlage',
          description: 'Strukturierte Vorlage mit separaten Arbeitsblättern für Immobilien und Kunden',
          url: '/api/templates/excel-template.xlsx',
          fileSize: 'ca. 15 KB'
        }
      ],
      supportedFormats: {
        import: ['CSV (.csv)', 'Excel (.xlsx, .xls)', 'Google Sheets (öffentliche URLs)'],
        export: ['CSV (.csv)', 'Excel (.xlsx)']
      },
      dataTypes: {
        properties: {
          required: ['title', 'type', 'location'],
          optional: ['description', 'address', 'price', 'area', 'rooms', 'bathrooms', 'bedrooms', 'condition', 'status']
        },
        customers: {
          required: ['name', 'email'],
          optional: ['phone', 'type', 'source', 'leadScore', 'status', 'budgetMin', 'budgetMax', 'preferredLocations', 'propertyTypes', 'timeline', 'address', 'occupation', 'company', 'notes']
        }
      }
    });
  } catch (error) {
    console.error('❌ Template info error:', error);
    res.status(500).json({ error: 'Template-Informationen konnten nicht abgerufen werden' });
  }
});

export default router;