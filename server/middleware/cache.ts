import { Request, Response, NextFunction } from "express";

interface CacheOptions {
  duration: number; // in seconds
  private?: boolean;
}

const cache = new Map<
  string,
  { data: any; timestamp: number; maxAge: number }
>();

export function cacheMiddleware(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.maxAge * 1000) {
      console.log(`Cache hit for ${key}`);
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          maxAge: options.duration,
        });

        // Clean up old cache entries
        if (cache.size > 100) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) {
            cache.delete(oldestKey);
          }
        }
      }
      return originalJson(data);
    };

    // Set cache headers
    res.set({
      "Cache-Control": options.private
        ? `private, max-age=${options.duration}`
        : `public, max-age=${options.duration}`,
      ETag: `"${Date.now()}"`,
      Vary: "Accept-Encoding",
    });

    next();
  };
}

export function clearCache(pattern?: string) {
  if (pattern) {
    const keysArray = Array.from(cache.keys());
    for (const key of keysArray) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}
