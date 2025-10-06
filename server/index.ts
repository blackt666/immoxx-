import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
// Dynamic import for routes to prevent module-load errors from blocking server startup
// import { registerRoutes, validateAuthConfiguration } from "./routes.js";
import { storage } from "./storage.js";
import { PerformanceMonitor } from "./lib/performance-monitor.js";
import { startRateLimitCleanup } from "./services/rateLimitingService.js";
import { logger, log } from "./lib/logger.js";
// setupVite will be dynamically imported only when needed in development

// Add global type declarations
declare global {
  var serverReady: boolean;
  var initializationError: Error | null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// Use PORT environment variable for Replit autoscale deployment
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// Authentication configuration - CRITICAL: Force enabled in production
const AUTH_ENABLED = process.env.NODE_ENV === 'production' 
  ? true // SECURITY: Always enable authentication in production
  : process.env.AUTH_ENABLED === 'true'; // Allow disabling only in development

if (process.env.NODE_ENV === 'development') {
  log.info(`🏗️ BODENSEE IMMOBILIEN PRODUCTION SERVER`);
  log.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`🌍 Server binding: ${HOST}:${PORT}`);
  log.info(`📦 Ready for Replit autoscale deployment`);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - Secure configuration for Replit
const corsOrigins: (string | RegExp)[] = [
  /^https?:\/\/[^/]+\.replit\.(dev|app)$/
];

if (process.env.NODE_ENV === 'development') {
  corsOrigins.push(`http://localhost:${PORT}`);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range']
}));

// Performance monitoring middleware
app.use(PerformanceMonitor.middleware());

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SECURITY: Trust proxy configuration for production deployment
if (process.env.NODE_ENV === 'production') {
  // Enable trust proxy for production (required for secure cookies behind reverse proxy)
  app.set('trust proxy', 1);
  log.info('🔒 Production: Trust proxy enabled for secure cookies');
} else {
  // Development: No proxy trust needed for local development
  app.set('trust proxy', false);
}

// CRITICAL: Health check route - only handle specific health check paths
// Let the frontend handle the homepage route properly

// CRITICAL: /api/health endpoint mounted EARLY - required for tests
// This MUST be available before heavy initialization starts
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: global.serverReady ? 'ready' : 'starting',
    ready: global.serverReady,
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    service: 'bodensee-immobilien',
    error: global.initializationError ? global.initializationError.message : null
  };
  
  return res.status(200).json(healthStatus);
});

// Additional dedicated health endpoint for deployment monitoring
app.get('/health', (req, res) => {
  const healthStatus = {
    status: global.serverReady ? 'ready' : 'starting',
    ready: global.serverReady,
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    service: 'bodensee-immobilien',
    error: global.initializationError ? global.initializationError.message : null
  };
  
  return res.status(200).json(healthStatus);
});

// SECURITY: Enhanced environment validation with production requirements
if (process.env.NODE_ENV === 'production') {
  // CRITICAL: Require essential environment variables in production
  const requiredProductionVars = ['SESSION_SECRET', 'DATABASE_URL'];
  const missingVars = requiredProductionVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log.error('❌ SECURITY CRITICAL: Missing required environment variables in production:');
    log.error(`   Missing: ${missingVars.join(', ')}`);
    log.error('   Server cannot start without secure configuration in production!');
    
    // Set initialization error for health checks
    global.initializationError = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    
    throw new Error(`SECURITY: Missing required environment variables in production: ${missingVars.join(', ')}`);
  }
  
  // SECURITY: Validate SESSION_SECRET strength
  if (process.env.SESSION_SECRET!.length < 32) {
    log.error('❌ SECURITY CRITICAL: SESSION_SECRET must be at least 32 characters in production!');
    throw new Error('SECURITY: SESSION_SECRET too weak for production environment');
  }

  log.info('✅ PRODUCTION: All required environment variables validated');
} else {
  // Development environment - warn about missing vars but allow defaults
  if (!process.env.SESSION_SECRET) {
    log.warn('⚠️ DEVELOPMENT: Using default SESSION_SECRET. Set SESSION_SECRET for security!');
  }
  if (!process.env.DATABASE_URL) {
    log.warn('⚠️ DEVELOPMENT: DATABASE_URL not set. Session store will fallback to MemoryStore.');
  }
  log.info('✅ DEVELOPMENT: Environment configuration validated');
}

// SECURITY: Production-grade session configuration with PostgreSQL store
let sessionStore;
let sessionConfig;

if (process.env.NODE_ENV === 'production') {
  // PRODUCTION: Use PostgreSQL-based session store for persistence and security
  const PgSession = connectPgSimple(session);
  
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions', // Custom table name for sessions
    createTableIfMissing: true,
    ttl: 24 * 60 * 60, // 24 hours in seconds
    disableTouch: false, // Allow session touch to extend expiry
    pruneSessionInterval: 60 * 15, // Cleanup expired sessions every 15 minutes
    errorLog: (err: Error) => {
      console.error('🔥 PostgreSQL Session Store Error:', err);
    }
  });
  
  console.log('🔒 PRODUCTION: Using PostgreSQL session store for secure persistence');
  
  sessionConfig = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET!, // Required in production, validated above
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on each request
    name: 'bodensee.session.id',
    cookie: {
      secure: true, // HTTPS only in production
      httpOnly: true, // Prevent XSS access
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' as const, // Strict CSRF protection
      domain: undefined, // Let browser determine domain
      path: '/'
    }
  };
} else {
  // DEVELOPMENT: Use MemoryStore for simplicity
  console.log('📝 DEVELOPMENT: Using MemoryStore for session management (development only)');
  
  sessionConfig = {
    secret: process.env.SESSION_SECRET || 'bodensee-dev-secret-2025',
    resave: false,
    saveUninitialized: false,
    name: 'bodensee.session.id',
    cookie: {
      secure: false, // HTTP allowed in development
      httpOnly: true, // Still prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' as const // More permissive for development
    }
  };
}

app.use(session(sessionConfig));

// Static file serving with fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// In development, serve via Vite middleware; in production, serve static assets
if (process.env.NODE_ENV !== 'production') {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Development mode: Vite middleware will serve frontend');
  }
} else {
  // Try dist/public first, fallback to server/public
  const frontendPath = path.join(process.cwd(), 'dist', 'public');
  const fallbackPath = path.join(process.cwd(), 'server', 'public');

  try {
    if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
      app.use(express.static(frontendPath));
      console.log('📦 Serving frontend from dist/public');
    } else {
      app.use(express.static(fallbackPath));
      console.log('📦 Serving frontend from server/public (fallback)');
    }
  } catch (e) {
    app.use(express.static(fallbackPath));
    console.log('📦 Serving frontend from server/public (error fallback)');
  }
}

// Declare variables for proper scoping
declare global {
  var serverReady: boolean;
  var initializationError: Error | null;
}

// Expose server state globally for API routes
global.serverReady = false;
global.initializationError = null;

// Initialize storage and register routes  
async function startServer() {
  let httpServer;
  
  try {
    // SECURITY: Validate authentication configuration BEFORE starting server (if enabled)
    // This will be done after dynamic import of routes module
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 SECURITY: Authentication validation deferred until routes module loads');
    }

    // Create HTTP server with basic health check - FAST STARTUP
    httpServer = createServer(app);
    
    // ENHANCED: Add robust error handling BEFORE listening
    httpServer.on('error', (error: any) => {
      console.error('❌ HTTP Server Error:', error);
      global.initializationError = error;
      global.serverReady = false;
      if (error.code === 'EADDRINUSE') {
        console.error(`💀 Port ${PORT} is already in use. Cannot start server.`);
        process.exit(1);
      }
    });
    
    // Start listening immediately for health checks with enhanced callback
    httpServer.listen(PORT, HOST, async () => {
      console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      try {
        // CRITICAL FIX: Register routes FIRST, before setting serverReady=true
        // This ensures all endpoints (including auth) are available when ready=true
        console.log('🔧 CRITICAL: Registering routes before setting serverReady flag...');
        
        // Initialize database first (required for routes)
        console.log('🔄 Initializing database for routes...');
        await storage.ensureInitialized();
        console.log('✅ Database initialized');
        
        // Register API routes using dynamic import
        console.log('🔧 Dynamically importing and registering routes...');
        const { registerRoutes, validateAuthConfiguration } = await import('./routes.js');
        
        // Validate authentication configuration after successful import
        if (AUTH_ENABLED) {
          console.log('🔒 SECURITY: Starting authentication validation...');
          await validateAuthConfiguration();
          console.log('✅ SECURITY: Authentication validation passed');
        } else {
          console.log('⚠️ SECURITY: Authentication disabled - skipping validation');
        }
        
        await registerRoutes(app);
        console.log('✅ Routes registered successfully');
        
        // NOW set serverReady=true AFTER routes are available
        global.serverReady = true;
        global.initializationError = null;
        console.log(`✅ Server ready for health checks on /api/health`);
        console.log(`🌟 CRITICAL: serverReady flag set to TRUE AFTER routes registration`);
        
        // Continue other initialization in background after server is ready
        continueBackgroundInitialization().catch(error => {
          console.error('❌ Background services initialization failed:', error);
          global.initializationError = error instanceof Error ? error : new Error(String(error));
          // Don't set serverReady=false here - keep health checks working
        });
        
      } catch (error) {
        console.error('❌ Critical route registration failed:', error);
        global.initializationError = error instanceof Error ? error : new Error(String(error));
        global.serverReady = false;
        
        // Set up fallback health endpoint if routes fail to load
        app.get('/api/health-fallback', (req, res) => {
          res.json({
            status: 'degraded',
            message: 'Server running but routes failed to load',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }
    });

  } catch (error) {
    console.error('❌ Critical server startup failed:', error);
    global.initializationError = error instanceof Error ? error : new Error(String(error));
    global.serverReady = false;
    if (process.env.NODE_ENV === 'production' && AUTH_ENABLED) {
      console.error('💀 Authentication enabled but startup failed - exiting');
      process.exit(1);
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Startup failed but authentication is disabled - continuing with limited functionality');
    }
  }
}

// Background initialization for services after server and routes are ready
async function continueBackgroundInitialization() {
  try {
    console.log('🔄 Starting background services initialization...');

    // Setup Vite dev middleware in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Setting up Vite dev middleware...');
      try {
        // Dynamic import to prevent module resolution failures when vite is not available
        const { setupVite } = await import('./vite');
        await setupVite(app);
        console.log('✅ Vite dev middleware ready');
      } catch (error) {
        console.warn('⚠️ Failed to load Vite module:', error instanceof Error ? error.message : error);
        console.log('🔧 Server continuing without Vite dev middleware');
      }
    }

    // Start rate limiting cleanup service (slow service that can run in background)
    startRateLimitCleanup();
    console.log('🔒 Rate limiting cleanup service started');

    // Serve frontend for all non-API, non-asset routes with fallback (production only)
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
        const accept = req.headers.accept || '';
        if (!accept.includes('text/html')) return next(); // don't hijack assets
        const indexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
        const fallbackIndex = path.join(process.cwd(), 'server', 'public', 'index.html');

        try {
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.sendFile(fallbackIndex);
          }
        } catch (e) {
          res.sendFile(fallbackIndex);
        }
      });
    }

    // Background initialization complete - but server was already marked ready
    console.log(`✅ Background initialization completed successfully`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 Ready for autoscale deployment`);
      console.log('🔧 Upload functionality ready');
      console.log('✅✅✅ ALL SERVICES FULLY OPERATIONAL!');
    }

  } catch (error) {
    console.error('❌ Background initialization failed:', error);
    global.initializationError = error instanceof Error ? error : new Error(String(error));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Server continuing with basic functionality...');
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');

  if (process.env.NODE_ENV === 'development') {
    // Token maintenance service disabled
    console.log('✅ Token maintenance service disabled');
  }

  await storage.close();
  process.exit(0);
});

// Add global error handlers for server stability
process.on('uncaughtException', (error) => {
  log.error('💀 UNCAUGHT EXCEPTION - Server stability compromised', { error: error.message, stack: error.stack });
  // Don't exit in production, try to recover
  if (process.env.NODE_ENV === 'production') {
    log.error('🔄 Attempting to maintain server operation despite uncaught exception');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('💀 UNHANDLED PROMISE REJECTION - Server stability compromised', { reason, promise });
  // Don't exit in production, log and continue
  if (process.env.NODE_ENV === 'production') {
    log.error('🔄 Continuing server operation despite unhandled rejection');
  } else {
    process.exit(1);
  }
});

// Also handle SIGINT for development
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');

  if (process.env.NODE_ENV === 'development') {
    // Token maintenance service disabled
    console.log('✅ Token maintenance service disabled');
  }

  await storage.close();
  process.exit(0);
});

startServer();