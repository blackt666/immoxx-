
import { performance } from "perf_hooks";

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: string;
  endpoint?: string;
  userAgent?: string;
  statusCode?: number;
}

export interface PerformanceReport {
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  endpoints: {
    [key: string]: {
      averageResponseTime: number;
      requestCount: number;
      errorCount: number;
    };
  };
  systemHealth: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    loadAverage: number[];
  };
  timeline: PerformanceMetrics[];
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static dbMetrics: Map<string, { totalTime: number; count: number; lastUpdated: number }> = new Map();
  private static cacheStats: { hits: number; misses: number; size: number } = { hits: 0, misses: 0, size: 0 };
  private static startTime = Date.now();
  private static readonly MAX_METRICS = 1000; // Keep last 1000 requests

  static startRequest(): number {
    return performance.now();
  }

  static endRequest(startTime: number, req: any, res: any): void {
    const responseTime = performance.now() - startTime;
    
    const metric: PerformanceMetrics = {
      responseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl,
      userAgent: req.get("User-Agent"),
      statusCode: res.statusCode
    };

    this.addMetric(metric);
  }

  private static addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  static getReport(): PerformanceReport {
    const now = Date.now();
    const uptime = (now - this.startTime) / 1000;
    
    if (this.metrics.length === 0) {
      return {
        summary: {
          averageResponseTime: 0,
          totalRequests: 0,
          errorRate: 0,
          uptime
        },
        endpoints: {},
        systemHealth: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          loadAverage: [0, 0, 0]
        },
        timeline: []
      };
    }

    // Calculate summary metrics
    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = this.metrics.filter(m => m.statusCode && m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Group by endpoint
    const endpoints: { [key: string]: { averageResponseTime: number; requestCount: number; errorCount: number } } = {};
    
    this.metrics.forEach(metric => {
      if (!metric.endpoint) return;
      
      const endpoint = metric.endpoint.split('?')[0]; // Remove query params
      
      if (!endpoints[endpoint]) {
        endpoints[endpoint] = {
          averageResponseTime: 0,
          requestCount: 0,
          errorCount: 0
        };
      }
      
      endpoints[endpoint].requestCount++;
      endpoints[endpoint].averageResponseTime += metric.responseTime;
      
      if (metric.statusCode && metric.statusCode >= 400) {
        endpoints[endpoint].errorCount++;
      }
    });

    // Calculate averages for endpoints
    Object.keys(endpoints).forEach(endpoint => {
      endpoints[endpoint].averageResponseTime /= endpoints[endpoint].requestCount;
    });

    return {
      summary: {
        averageResponseTime,
        totalRequests,
        errorRate,
        uptime
      },
      endpoints,
      systemHealth: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        loadAverage: [0, 0, 0] // Not available in Node.js without external module
      },
      timeline: this.metrics.slice(-50) // Last 50 requests
    };
  }

  static getRealtimeMetrics(): {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
    lastRequests: PerformanceMetrics[];
  } {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: (Date.now() - this.startTime) / 1000,
      lastRequests: this.metrics.slice(-10) // Last 10 requests
    };
  }

  static middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = PerformanceMonitor.startRequest();
      
      res.on('finish', () => {
        PerformanceMonitor.endRequest(startTime, req, res);
      });
      
      next();
    };
  }

  static clearMetrics(): void {
    this.metrics = [];
    this.dbMetrics.clear();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
    this.startTime = Date.now();
  }

  // Enhanced database operation tracking
  static trackDbOperation(operation: string, timeMs: number): void {
    const existing = this.dbMetrics.get(operation) || { totalTime: 0, count: 0, lastUpdated: Date.now() };
    existing.totalTime += timeMs;
    existing.count += 1;
    existing.lastUpdated = Date.now();
    this.dbMetrics.set(operation, existing);
  }

  // Cache performance tracking
  static trackCacheHit(): void {
    this.cacheStats.hits++;
  }

  static trackCacheMiss(): void {
    this.cacheStats.misses++;
  }

  static updateCacheSize(size: number): void {
    this.cacheStats.size = size;
  }

  // Get comprehensive performance report including DB and cache metrics
  static getEnhancedReport(): PerformanceReport & {
    databaseOperations: Record<string, { averageTime: number; count: number; lastUpdated: number }>;
    cachePerformance: { hitRate: number; hits: number; misses: number; size: number };
    optimizationMetrics: {
      averageDbOperationTime: number;
      slowestDbOperations: Array<{ operation: string; averageTime: number }>;
    };
  } {
    const baseReport = this.getReport();
    
    // Process database metrics
    const databaseOperations: Record<string, { averageTime: number; count: number; lastUpdated: number }> = {};
    let totalDbTime = 0;
    let totalDbOperations = 0;

    for (const [operation, stats] of this.dbMetrics.entries()) {
      databaseOperations[operation] = {
        averageTime: stats.totalTime / stats.count,
        count: stats.count,
        lastUpdated: stats.lastUpdated
      };
      totalDbTime += stats.totalTime;
      totalDbOperations += stats.count;
    }

    // Find slowest operations
    const slowestDbOperations = Object.entries(databaseOperations)
      .sort(([,a], [,b]) => b.averageTime - a.averageTime)
      .slice(0, 5)
      .map(([operation, stats]) => ({ operation, averageTime: stats.averageTime }));

    // Calculate cache hit rate
    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalCacheRequests > 0 ? (this.cacheStats.hits / totalCacheRequests) * 100 : 0;

    return {
      ...baseReport,
      databaseOperations,
      cachePerformance: {
        hitRate,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        size: this.cacheStats.size
      },
      optimizationMetrics: {
        averageDbOperationTime: totalDbOperations > 0 ? totalDbTime / totalDbOperations : 0,
        slowestDbOperations
      }
    };
  }

  // Utility method for timing database operations
  static async timeDbOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.trackDbOperation(operationName, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackDbOperation(`${operationName}_error`, duration);
      throw error;
    }
  }
}
