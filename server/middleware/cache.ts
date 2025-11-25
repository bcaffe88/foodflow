import { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
const CACHE_TTL = 300; // 5 minutes

export async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      redisClient = createClient({ url: redisUrl });
    } else {
      redisClient = createClient();
    }
    await redisClient.connect();
    console.log("[Cache] ✅ Redis connected successfully");
  } catch (error) {
    console.warn("[Cache] Redis not available, caching disabled:", error);
    redisClient = null;
  }
}

export function cacheMiddleware(ttl: number = CACHE_TTL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || !redisClient) {
      return next();
    }

    const cacheKey = `cache:${req.path}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        res.set("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      console.warn("[Cache] Redis get error:", error);
    }

    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      try {
        if (redisClient && res.statusCode === 200) {
          redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch(err => {
            console.warn("[Cache] Redis set error:", err);
          });
        }
      } catch (error) {
        console.warn("[Cache] Error caching response:", error);
      }
      res.set("X-Cache", "MISS");
      return originalJson(data);
    };

    next();
  };
}

export async function invalidateCache(pattern: string) {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(`cache:${pattern}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn("[Cache] Error invalidating cache:", error);
  }
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
  }
}
