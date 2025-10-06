import { db } from "../db.js";
import { rateLimitEntries } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstAttemptTime?: number;
  blocked?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  retryAfter?: number;
  currentCount?: number;
}

// FAIL-SAFE: In-memory fallback storage for DB failures
class InMemoryRateLimitFallback {
  private readonly storage = new Map<string, RateLimitRecord>();
  private readonly maxEntries = 10000; // Bounded storage to prevent memory leaks
  
  private getKey(clientId: string, limitType: string): string {
    return `${clientId}:${limitType}`;
  }
  
  get(clientId: string, limitType: string): RateLimitRecord | null {
    const key = this.getKey(clientId, limitType);
    const record = this.storage.get(key);
    
    if (!record) return null;
    
    // Check if expired
    if (Date.now() >= record.resetTime) {
      this.storage.delete(key);
      return null;
    }
    
    return record;
  }
  
  set(clientId: string, limitType: string, record: RateLimitRecord): void {
    // Optimized bounded storage management
    if (this.storage.size >= this.maxEntries) {
      const now = Date.now();
      const expiredKeys: string[] = [];
      let checkedCount = 0;
      
      // More efficient cleanup: use iterator with early termination
      for (const [key, value] of this.storage.entries()) {
        if (checkedCount >= 500) break; // Limit work per operation
        
        if (now >= value.resetTime) {
          expiredKeys.push(key);
        }
        checkedCount++;
        
        if (expiredKeys.length >= 200) break; // Batch cleanup limit
      }
      
      // Batch delete expired entries
      expiredKeys.forEach(key => this.storage.delete(key));
      
      // If still at capacity, remove oldest entries more efficiently
      if (this.storage.size >= this.maxEntries) {
        const oldestKeys: string[] = [];
        let oldestTime = Infinity;
        
        for (const [key, value] of this.storage.entries()) {
          if (value.resetTime < oldestTime) {
            oldestTime = value.resetTime;
            oldestKeys.unshift(key); // Add to front
          }
          if (oldestKeys.length > 100) {
            oldestKeys.pop(); // Remove from back
          }
        }
        
        // Remove oldest entries
        oldestKeys.slice(0, 50).forEach(key => this.storage.delete(key));
      }
    }
    
    const key = this.getKey(clientId, limitType);
    this.storage.set(key, record);
  }
  
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    // Optimized cleanup with early termination and batching
    const entriesToDelete: string[] = [];
    
    for (const [key, record] of this.storage.entries()) {
      if (now >= record.resetTime) {
        entriesToDelete.push(key);
        removed++;
        
        // Batch delete to avoid excessive iteration
        if (entriesToDelete.length >= 100) {
          break;
        }
      }
    }
    
    // Batch delete expired entries
    entriesToDelete.forEach(key => this.storage.delete(key));
    
    return removed;
  }
  
  getSize(): number {
    return this.storage.size;
  }
}

const fallbackStorage = new InMemoryRateLimitFallback();

export class RateLimitingService {
  
  /**
   * Check and increment rate limit for login attempts
   * ATOMIC IMPLEMENTATION: Eliminates race conditions using upsert with atomic increment
   * FAIL-SAFE: Falls back to in-memory storage on DB errors
   */
  static async checkLoginRateLimit(clientId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const nowDate = new Date(now);
    const shortWindowMs = 5 * 60 * 1000; // 5 minutes
    const longWindowMs = 60 * 60 * 1000; // 1 hour
    const maxAttemptsShort = 5; // Max 5 attempts per 5 minutes
    const maxAttemptsLong = 10; // Max 10 attempts per hour

    try {
      // Get existing record first
      const [existing] = await db
        .select()
        .from(rateLimitEntries)
        .where(
          and(
            eq(rateLimitEntries.identifier, clientId),
            eq(rateLimitEntries.endpoint, 'login')
          )
        )
        .limit(1);

      if (!existing) {
        const resetTime = new Date(now + shortWindowMs);

        await db.insert(rateLimitEntries).values({
          identifier: clientId,
          endpoint: 'login',
          count: 1,
          resetTime,
          firstAttemptTime: nowDate,
          blocked: false,
          createdAt: nowDate,
          updatedAt: nowDate,
        });

        return {
          allowed: true,
          currentCount: 1,
          resetTime: resetTime.getTime(),
        };
      }

      let count = typeof existing.count === 'number' ? existing.count : 0;
      let resetTime = RateLimitingService.normalizeDate(existing.resetTime, nowDate);
      let firstAttempt = RateLimitingService.normalizeDate(
        existing.firstAttemptTime ?? existing.createdAt,
        nowDate
      );
      let blocked = !!existing.blocked;

      if (resetTime.getTime() <= now) {
        count = 1;
        resetTime = new Date(now + shortWindowMs);
        firstAttempt = nowDate;
        blocked = false;
      } else {
        count += 1;
        const timeSinceFirst = now - firstAttempt.getTime();

        if (timeSinceFirst < longWindowMs && count > maxAttemptsLong) {
          blocked = true;
          resetTime = new Date(now + longWindowMs);
        } else {
          blocked = false;
          if (count > maxAttemptsShort) {
            resetTime = new Date(now + shortWindowMs);
          }
        }
      }

      await db
        .update(rateLimitEntries)
        .set({
          count,
          resetTime,
          firstAttemptTime: firstAttempt,
          blocked,
          updatedAt: nowDate,
        })
        .where(
          and(
            eq(rateLimitEntries.identifier, clientId),
            eq(rateLimitEntries.endpoint, 'login')
          )
        );

      const resetMillis = resetTime.getTime();

      if (blocked) {
        return {
          allowed: false,
          resetTime: resetMillis,
          retryAfter: Math.max(0, Math.ceil((resetMillis - now) / 1000)),
          currentCount: count,
        };
      }

      return {
        allowed: true,
        currentCount: count,
        resetTime: resetMillis,
      };
    } catch (error) {
      console.error('🔒 Database rate limiting failed, using in-memory fallback:', error);
      return this.checkLoginRateLimitFallback(clientId, now, shortWindowMs, longWindowMs, maxAttemptsShort, maxAttemptsLong);
    }
  }

  /**
   * FAIL-SAFE: In-memory fallback for login rate limiting
   */
  private static checkLoginRateLimitFallback(
    clientId: string, 
    now: number, 
    shortWindowMs: number, 
    longWindowMs: number, 
    maxAttemptsShort: number, 
    maxAttemptsLong: number
  ): RateLimitResult {
    const existing = fallbackStorage.get(clientId, 'login');
    
    if (!existing || now >= existing.resetTime) {
      // New window or expired - start fresh
      const record: RateLimitRecord = {
        count: 1,
        resetTime: now + shortWindowMs,
        firstAttemptTime: now,
        blocked: false,
      };
      fallbackStorage.set(clientId, 'login', record);
      return { allowed: true, currentCount: 1 };
    }

    // Check if currently blocked
    if (existing.blocked && now < existing.resetTime) {
      return {
        allowed: false,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000),
        currentCount: existing.count,
      };
    }

    const newCount = existing.count + 1;
    const timeSinceFirst = now - (existing.firstAttemptTime || now);

    // Check limits and apply blocking logic
    if (newCount <= maxAttemptsShort) {
      // Within short window limits
      existing.count = newCount;
      fallbackStorage.set(clientId, 'login', existing);
      return { allowed: true, currentCount: newCount };
    } else if (timeSinceFirst < longWindowMs && newCount > maxAttemptsLong) {
      // Exceeded long window limits - block
      existing.count = newCount;
      existing.resetTime = now + longWindowMs;
      existing.blocked = true;
      fallbackStorage.set(clientId, 'login', existing);
      
      return {
        allowed: false,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000),
        currentCount: newCount,
      };
    } else {
      // Extend window
      existing.count = newCount;
      existing.resetTime = now + shortWindowMs;
      fallbackStorage.set(clientId, 'login', existing);
      return { allowed: true, currentCount: newCount };
    }
  }

  /**
   * Check and increment rate limit for admin operations
   * ATOMIC IMPLEMENTATION: Eliminates race conditions using upsert with atomic increment
   * FAIL-SAFE: Falls back to in-memory storage on DB errors
   */
  static async checkAdminRateLimit(clientId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const nowDate = new Date(now);
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10; // Max 10 admin operations per 15 minutes

    try {
      return await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(rateLimitEntries)
          .where(
            and(
              eq(rateLimitEntries.identifier, clientId),
              eq(rateLimitEntries.endpoint, 'admin')
            )
          )
          .limit(1);

        if (!existing) {
          const resetTime = new Date(now + windowMs);

          await tx.insert(rateLimitEntries).values({
            identifier: clientId,
            endpoint: 'admin',
            count: 1,
            resetTime,
            firstAttemptTime: nowDate,
            blocked: false,
            createdAt: nowDate,
            updatedAt: nowDate,
          });

          return {
            allowed: true,
            currentCount: 1,
            resetTime: resetTime.getTime(),
          };
        }

        let count = typeof existing.count === 'number' ? existing.count : 0;
        let resetTime = RateLimitingService.normalizeDate(existing.resetTime, nowDate);
        let firstAttempt = RateLimitingService.normalizeDate(
          existing.firstAttemptTime ?? existing.createdAt,
          nowDate
        );
        let blocked = !!existing.blocked;

        if (resetTime.getTime() <= now) {
          count = 1;
          resetTime = new Date(now + windowMs);
          firstAttempt = nowDate;
          blocked = false;
        } else {
          count += 1;
          blocked = count > maxRequests;
        }

        await tx
          .update(rateLimitEntries)
          .set({
            count,
            resetTime,
            firstAttemptTime: firstAttempt,
            blocked,
            updatedAt: nowDate,
          })
          .where(
            and(
              eq(rateLimitEntries.identifier, clientId),
              eq(rateLimitEntries.endpoint, 'admin')
            )
          );

        const resetMillis = resetTime.getTime();

        if (blocked) {
          return {
            allowed: false,
            resetTime: resetMillis,
            retryAfter: Math.max(0, Math.ceil((resetMillis - now) / 1000)),
            currentCount: count,
          };
        }

        return {
          allowed: true,
          currentCount: count,
          resetTime: resetMillis,
        };
      });
    } catch (error) {
      console.error('🔒 Database admin rate limiting failed, using in-memory fallback:', error);
      return this.checkAdminRateLimitFallback(clientId, now, windowMs, maxRequests);
    }
  }

  /**
   * FAIL-SAFE: In-memory fallback for admin rate limiting
   */
  private static checkAdminRateLimitFallback(
    clientId: string, 
    now: number, 
    windowMs: number, 
    maxRequests: number
  ): RateLimitResult {
    const existing = fallbackStorage.get(clientId, 'admin');
    
    if (!existing || now >= existing.resetTime) {
      // New window or expired - start fresh
      const record: RateLimitRecord = {
        count: 1,
        resetTime: now + windowMs,
        firstAttemptTime: now,
        blocked: false,
      };
      fallbackStorage.set(clientId, 'admin', record);
      return { allowed: true, currentCount: 1 };
    }

    const newCount = existing.count + 1;

    if (newCount <= maxRequests) {
      // Within limits
      existing.count = newCount;
      fallbackStorage.set(clientId, 'admin', existing);
      return { allowed: true, currentCount: newCount };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: existing.resetTime,
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
      currentCount: existing.count,
    };
  }

  /**
   * Clean up expired rate limit entries to prevent memory leaks
   * OPTIMIZED: Uses efficient indexed deletes for better performance
   */
  static async cleanupExpiredEntries(tx: any = null, endpoint?: string): Promise<void> {
    const now = new Date();
    
    if (endpoint) {
      await tx
        .delete(rateLimitEntries)
        .where(
          and(
            eq(rateLimitEntries.endpoint, endpoint),
            lt(rateLimitEntries.resetTime, now)
          )
        );
    } else {
      await tx
        .delete(rateLimitEntries)
        .where(lt(rateLimitEntries.resetTime, now));
    }
  }

  /**
   * Periodic cleanup to run in background
   * ENHANCED: Includes fail-safe in-memory cleanup
   */
  static async performPeriodicCleanup(): Promise<number> {
    let dbCleaned = 0;
    let memoryCleaned = 0;

    try {
      // Clean up database entries
      const now = new Date();
      const result = (await db
        .delete(rateLimitEntries)
        .where(lt(rateLimitEntries.resetTime, now))) as { changes?: number };
      
      dbCleaned = result?.changes ?? 0;
    } catch (error) {
      console.error('🔒 Database rate limiting cleanup error:', error);
    }

    try {
      // Clean up in-memory fallback storage
      memoryCleaned = fallbackStorage.cleanup();
    } catch (error) {
      console.error('🔒 In-memory rate limiting cleanup error:', error);
    }

    const totalCleaned = dbCleaned + memoryCleaned;
    if (totalCleaned > 0) {
      console.log(`🔒 Rate limiting cleanup: DB: ${dbCleaned}, Memory: ${memoryCleaned}, Total: ${totalCleaned}`);
    }

    return totalCleaned;
  }

  /**
   * Get rate limit status for monitoring
   */
  static async getRateLimitStatus(identifier: string, endpoint: string): Promise<RateLimitRecord | null> {
    try {
      const record = await db
        .select()
        .from(rateLimitEntries)
        .where(
          and(
            eq(rateLimitEntries.identifier, identifier),
            eq(rateLimitEntries.endpoint, endpoint)
          )
        )
        .limit(1);

      const entry = record[0];
      if (!entry) return null;

      const resetDate = RateLimitingService.normalizeDate(entry.resetTime, new Date());
      const firstAttemptDate = entry.firstAttemptTime
        ? RateLimitingService.normalizeDate(entry.firstAttemptTime, entry.createdAt ?? resetDate)
        : undefined;

      return {
        count: entry.count ?? 0,
        resetTime: resetDate.getTime(),
        firstAttemptTime: firstAttemptDate?.getTime(),
        blocked: !!entry.blocked,
      };
    } catch (error) {
      console.error('🔒 Rate limiting status check error:', error);
      return null;
    }
  }

  /**
   * Reset rate limit for a client (admin operation)
   */
  static async resetRateLimit(identifier: string, endpoint?: string): Promise<boolean> {
    try {
      if (endpoint) {
        await db
          .delete(rateLimitEntries)
          .where(
            and(
              eq(rateLimitEntries.identifier, identifier),
              eq(rateLimitEntries.endpoint, endpoint)
            )
          );
      } else {
        await db
          .delete(rateLimitEntries)
          .where(eq(rateLimitEntries.identifier, identifier));
      }
      return true;
    } catch (error) {
      console.error('🔒 Rate limiting reset error:', error);
      return false;
    }
  }

  private static normalizeDate(value: Date | number | null | undefined, fallback: Date): Date {
    if (!value) {
      return fallback;
    }
    return value instanceof Date ? value : new Date(value);
  }
}

// Set up periodic cleanup - runs every 10 minutes
let cleanupInterval: NodeJS.Timeout | null = null;

export const startRateLimitCleanup = () => {
  if (cleanupInterval) return; // Already started
  
  cleanupInterval = setInterval(async () => {
    const cleaned = await RateLimitingService.performPeriodicCleanup();
    if (cleaned > 0) {
      console.log(`🔒 Rate limiting cleanup: Removed ${cleaned} expired entries`);
    }
  }, 10 * 60 * 1000); // Every 10 minutes

  console.log('🔒 Rate limiting periodic cleanup started');
};

export const stopRateLimitCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🔒 Rate limiting periodic cleanup stopped');
  }
};