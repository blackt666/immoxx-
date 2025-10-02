// Replit environment detection and utilities
export function isReplit(): boolean {
  return !!(process.env.REPL_SLUG || process.env.REPL_OWNER);
}

export function getReplitInfo() {
  if (!isReplit()) return null;

  return {
    slug: process.env.REPL_SLUG,
    owner: process.env.REPL_OWNER,
    id: process.env.REPL_ID,
    language: process.env.REPL_LANGUAGE,
    replUrl: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
  };
}

export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    rssMB: Math.round(usage.rss / 1024 / 1024),
    isHighUsage: usage.heapUsed / 1024 / 1024 > 450, // Replit constraint
  };
}

export function getDatabaseUrl(): string {
  if (isReplit()) {
    // Replit provides DATABASE_URL through their PostgreSQL service
    const replitDbUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;
    if (replitDbUrl) {
      // Ensure proper postgresql:// format
      return replitDbUrl.replace(/^postgres:\/\//, "postgresql://");
    }
    // Fallback for Replit's legacy DB
    return "postgresql://postgres:password@localhost:5432/bodensee_immobilien";
  }

  // Local development
  return (
    process.env.DATABASE_URL ||
    "postgresql://localhost:5432/bodensee_immobilien"
  );
}

export function getSessionConfig() {
  return {
    secret: process.env.SESSION_SECRET || "bodensee-immobilien-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTP in development, HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      // Replit-specific optimizations
      httpOnly: true,
      sameSite: isReplit() ? "lax" : "strict",
    },
    // Store configuration
    store: undefined, // Will be configured based on environment
  };
}

// Memory monitoring for Replit
export function startMemoryMonitoring() {
  if (!isReplit()) return;

  setInterval(() => {
    const memory = getMemoryUsage();
    if (memory.isHighUsage) {
      console.warn(`🚨 High memory usage on Replit: ${memory.heapUsedMB}MB`);
      // Could trigger garbage collection or other optimizations
      if (global.gc) {
        global.gc();
        console.log("🧹 Triggered garbage collection");
      }
    }
  }, 30000); // Check every 30 seconds
}

// Replit-specific rate limiting
export function getRateLimitConfig() {
  if (isReplit()) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    };
  }

  // More generous limits for local development
  return {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  };
}
