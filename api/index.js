#!/usr/bin/env node
/**
 * Vercel Serverless Entry Point
 * This file is the entry point for Vercel deployments
 * It exports the Express app for serverless function handling
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "node:fs";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "../dist/server/storage.js";
import { PerformanceMonitor } from "../dist/server/lib/performance-monitor.js";
import { startRateLimitCleanup } from "../dist/server/services/rateLimitingService.js";
import { log } from "../dist/server/lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Vercel
const corsOrigins = [
  /^https?:\/\/[^/]+\.vercel\.app$/,
  /^https?:\/\/localhost:\d+$/
];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range']
}));

// Performance monitoring
app.use(PerformanceMonitor.middleware());

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Session configuration for Vercel
const MemoryStore = createMemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'bodensee-vercel-secret-2025',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  name: 'bodensee.session.id',
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict',
    path: '/'
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ready',
    ready: true,
    timestamp: new Date().toISOString(),
    environment: 'production',
    service: 'bodensee-immobilien',
    platform: 'vercel'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ready',
    ready: true,
    timestamp: new Date().toISOString(),
    environment: 'production',
    service: 'bodensee-immobilien',
    platform: 'vercel'
  });
});

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve frontend from dist/public
const frontendPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(frontendPath));

// Initialize and register routes
let routesRegistered = false;

async function initializeApp() {
  if (routesRegistered) return;
  
  try {
    console.log('🔄 Initializing database...');
    await storage.ensureInitialized();
    console.log('✅ Database initialized');
    
    console.log('🔧 Registering routes...');
    const { registerRoutes } = await import('../dist/server/routes.js');
    await registerRoutes(app);
    console.log('✅ Routes registered');
    
    routesRegistered = true;
    
    // Start cleanup services
    startRateLimitCleanup();
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error;
  }
}

// SPA fallback - serve index.html for all non-API routes
app.get('*', async (req, res, next) => {
  // Initialize app on first request
  if (!routesRegistered) {
    try {
      await initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      return res.status(503).send('Service temporarily unavailable');
    }
  }
  
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  const accept = req.headers.accept || '';
  if (!accept.includes('text/html')) {
    return next();
  }
  
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found');
  }
});

// Export for Vercel serverless
export default app;
