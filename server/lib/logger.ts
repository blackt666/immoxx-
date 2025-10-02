import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Erstelle logs-Verzeichnis falls nicht vorhanden
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log-Level basierend auf Environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Füge Stack-Trace hinzu bei Fehlern
    if (stack) {
      log += `\n${stack}`;
    }

    // Füge zusätzliche Metadaten hinzu
    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// File transport für alle Logs
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Error-only transport
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Console transport für Development
const consoleTransport = new winston.transports.Console({
  level: logLevel,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  )
});

// Erstelle Logger-Instanz
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    fileRotateTransport,
    errorFileRotateTransport,
    ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : [])
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// Helper-Funktionen für verschiedene Log-Level
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),

  // Spezielle Helper für Server-Events
  server: {
    start: (port: number, host: string) => logger.info(`🚀 Server started on ${host}:${port}`),
    ready: () => logger.info('✅ Server ready for requests'),
    shutdown: (signal: string) => logger.info(`📴 Server shutting down (${signal})`),
    error: (error: Error, context?: string) => logger.error(`Server error${context ? ` in ${context}` : ''}`, { error: error.message, stack: error.stack })
  },

  // Datenbank-Logging
  database: {
    connected: () => logger.info('✅ Database connected'),
    error: (error: Error) => logger.error('Database error', { error: error.message, stack: error.stack }),
    query: (query: string, duration?: number) => logger.debug('Database query executed', { query, duration })
  },

  // API-Logging
  api: {
    request: (method: string, url: string, ip: string, userAgent?: string) =>
      logger.http(`API Request: ${method} ${url}`, { ip, userAgent }),
    response: (method: string, url: string, statusCode: number, duration: number) =>
      logger.info(`API Response: ${method} ${url} ${statusCode}`, { duration }),
    error: (method: string, url: string, error: Error, statusCode?: number) =>
      logger.error(`API Error: ${method} ${url}`, { error: error.message, statusCode, stack: error.stack })
  }
};

// Performance-Monitoring
export class PerformanceLogger {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  log(message: string, meta?: any) {
    const duration = Date.now() - this.startTime;
    logger.info(`${message} (${duration}ms)`, { ...meta, duration });
  }

  error(message: string, error?: Error, meta?: any) {
    const duration = Date.now() - this.startTime;
    logger.error(`${message} (${duration}ms)`, {
      ...meta,
      duration,
      error: error?.message,
      stack: error?.stack
    });
  }
}

// Exportiere für einfache Verwendung
export default logger;
