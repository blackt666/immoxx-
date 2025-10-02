import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    cb(null, mimetype && extname);
  }
});

// CONSOLIDATED: Single source of truth for data import configuration
export const importUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "import-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB for larger spreadsheets
    fieldSize: 1 * 1024 * 1024,   // 1MB field size limit
    files: 1                       // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (!mimetype || !extname) {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Configure multer for JSON backup files
export const backupUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "backup-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for large backup files
  fileFilter: (req, file, cb) => {
    const allowedTypes = /json/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      'application/json',
      'text/json',
      'application/octet-stream' // Some browsers send this for .json files
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype === 'application/octet-stream';
    
    if (!mimetype || !extname) {
      return cb(new Error('Only JSON files are allowed for backup uploads'));
    }
    cb(null, true);
  }
});