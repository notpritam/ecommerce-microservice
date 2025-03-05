import logger from "../config/logger";
import { getRedisClient } from "../config/redis";

// Here Constants are in seconds so 3600 means 1 hour

const DEFAULT_TTL = 3600;
const SESSION_TTL = 86400;
const RATE_LIMIT_TTL = 60;
const PRODUCT_CACHE_TTL = 7200;
const USER_CACHE_TTL = 3600;
const TEMP_DATA_TTL = 1800;

const KEY = {
  PRODUCT: "product:",
  USER: "user:",
  SESSION: "session:",
  RATE_LIMIT: "rate:",
  ACTIVITY: "activity:",
  RECOMMENDATION: "recommendation:",
  JOB_LOCK: "job:lock:",
  NOTIFICATION: "notification:",
  ANALYTICS: "analytics:",
  TEMP: "temp:",
};

export const RedisService = {
  // Product Cache
  productCache: {
    async get(productId: string): Promise<any> {
      try {
        const redis = getRedisClient();
        const result = await redis.get(`${KEY.PRODUCT}${productId}`);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        logger.error("Error getting product from cache:", error);
        return null;
      }
    },

    async set(
      productId: string,
      data: any,
      ttl = PRODUCT_CACHE_TTL
    ): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.set(
          `${KEY.PRODUCT}${productId}`,
          JSON.stringify(data),
          "EX",
          ttl
        );
      } catch (error) {
        logger.error("Error setting product in cache:", error);
      }
    },

    async delete(productId: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.PRODUCT}${productId}`);
      } catch (error) {
        logger.error("Error deleting product from cache:", error);
      }
    },
  },

  // User Cache
  userCache: {
    async get(userId: string): Promise<any> {
      try {
        const redis = getRedisClient();
        const result = await redis.get(`${KEY.USER}${userId}`);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        logger.error("Error getting user from cache:", error);
        return null;
      }
    },

    async set(userId: string, data: any, ttl = USER_CACHE_TTL): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.set(
          `${KEY.USER}${userId}`,
          JSON.stringify(data),
          "EX",
          ttl
        );
      } catch (error) {
        logger.error("Error setting user in cache:", error);
      }
    },

    async delete(userId: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.USER}${userId}`);
      } catch (error) {
        logger.error("Error deleting user from cache:", error);
      }
    },
  },

  // Session Store
  sessionStore: {
    async get(sessionId: string): Promise<any> {
      try {
        const redis = getRedisClient();
        const result = await redis.get(`${KEY.SESSION}${sessionId}`);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        logger.error("Error getting session from store:", error);
        return null;
      }
    },

    async set(sessionId: string, data: any, ttl = SESSION_TTL): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.set(
          `${KEY.SESSION}${sessionId}`,
          JSON.stringify(data),
          "EX",
          ttl
        );
      } catch (error) {
        logger.error("Error setting session in store:", error);
      }
    },

    async delete(sessionId: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.SESSION}${sessionId}`);
      } catch (error) {
        logger.error("Error deleting session from store:", error);
      }
    },

    async extend(sessionId: string, ttl = SESSION_TTL): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.expire(`${KEY.SESSION}${sessionId}`, ttl);
      } catch (error) {
        logger.error("Error extending session TTL:", error);
      }
    },
  },

  // Rate Limit Counters
  rateLimiter: {
    async increment(
      key: string,
      limit: number = 100,
      windowSecs: number = RATE_LIMIT_TTL
    ): Promise<{
      current: number;
      remaining: number;
      isRateLimited: boolean;
    }> {
      try {
        const redis = getRedisClient();
        const redisKey = `${KEY.RATE_LIMIT}${key}`;

        // Get current count or 0 if it doesn't exist
        const exists = await redis.exists(redisKey);
        if (!exists) {
          await redis.set(redisKey, 1, "EX", windowSecs);
          return { current: 1, remaining: limit - 1, isRateLimited: false };
        }

        // Increment and get current value
        const current = await redis.incr(redisKey);

        // Ensure TTL is set (in case it was manually deleted)
        const ttl = await redis.ttl(redisKey);
        if (ttl === -1) {
          await redis.expire(redisKey, windowSecs);
        }

        const remaining = Math.max(0, limit - current);
        return {
          current,
          remaining,
          isRateLimited: current > limit,
        };
      } catch (error) {
        logger.error("Error incrementing rate limit counter:", error);
        // In case of failure, allow the request
        return { current: 0, remaining: limit, isRateLimited: false };
      }
    },

    async reset(key: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.RATE_LIMIT}${key}`);
      } catch (error) {
        logger.error("Error resetting rate limit counter:", error);
      }
    },
  },

  // User Activity Tracking
  userActivity: {
    async track(
      userId: string,
      activityType: string,
      metadata: any = {}
    ): Promise<void> {
      try {
        const redis = getRedisClient();
        const now = Date.now();
        const activity = {
          timestamp: now,
          type: activityType,
          metadata,
        };

        // Record in user's activity list (capped at 1000 items)
        await redis.lpush(`${KEY.ACTIVITY}${userId}`, JSON.stringify(activity));
        await redis.ltrim(`${KEY.ACTIVITY}${userId}`, 0, 999);

        // Also store in a time-based activity collection for analytics
        const date = new Date(now).toISOString().split("T")[0]; // YYYY-MM-DD
        await redis.zadd(
          `${KEY.ANALYTICS}activity:${date}`,
          now,
          JSON.stringify({
            ...activity,
            userId,
          })
        );
      } catch (error) {
        logger.error("Error tracking user activity:", error);
      }
    },

    async getRecent(userId: string, limit: number = 50): Promise<any[]> {
      try {
        const redis = getRedisClient();
        const activities = await redis.lrange(
          `${KEY.ACTIVITY}${userId}`,
          0,
          limit - 1
        );
        return activities.map((a) => JSON.parse(a));
      } catch (error) {
        logger.error("Error getting user activities:", error);
        return [];
      }
    },
  },

  // Recommendation Cache
  recommendationCache: {
    async get(userId: string, context: string = "default"): Promise<any[]> {
      try {
        const redis = getRedisClient();
        const result = await redis.get(
          `${KEY.RECOMMENDATION}${userId}:${context}`
        );
        return result ? JSON.parse(result) : [];
      } catch (error) {
        logger.error("Error getting recommendations from cache:", error);
        return [];
      }
    },

    async set(
      userId: string,
      recommendations: any[],
      context: string = "default",
      ttl = DEFAULT_TTL
    ): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.set(
          `${KEY.RECOMMENDATION}${userId}:${context}`,
          JSON.stringify(recommendations),
          "EX",
          ttl
        );
      } catch (error) {
        logger.error("Error setting recommendations in cache:", error);
      }
    },

    async delete(userId: string, context: string = "default"): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.RECOMMENDATION}${userId}:${context}`);
      } catch (error) {
        logger.error("Error deleting recommendations from cache:", error);
      }
    },
  },

  // Job Locks
  jobLocks: {
    async acquire(jobId: string, ttl: number = 60): Promise<boolean> {
      try {
        const redis = getRedisClient();
        // NX = only set if key doesn't exist
        const result = await redis.set(
          `${KEY.JOB_LOCK}${jobId}`,
          "1",
          "EX",
          ttl,
          "NX"
        );
        return result === "OK";
      } catch (error) {
        logger.error("Error acquiring job lock:", error);
        return false;
      }
    },

    async release(jobId: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.JOB_LOCK}${jobId}`);
      } catch (error) {
        logger.error("Error releasing job lock:", error);
      }
    },

    async extend(jobId: string, ttl: number = 60): Promise<boolean> {
      try {
        const redis = getRedisClient();
        return (await redis.expire(`${KEY.JOB_LOCK}${jobId}`, ttl)) === 1;
      } catch (error) {
        logger.error("Error extending job lock:", error);
        return false;
      }
    },
  },

  // Notification Status
  notificationStatus: {
    async setStatus(notificationId: string, status: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.hset(`${KEY.NOTIFICATION}status`, notificationId, status);
      } catch (error) {
        logger.error("Error setting notification status:", error);
      }
    },

    async getStatus(notificationId: string): Promise<string> {
      try {
        const redis = getRedisClient();
        return (
          (await redis.hget(`${KEY.NOTIFICATION}status`, notificationId)) ||
          "unknown"
        );
      } catch (error) {
        logger.error("Error getting notification status:", error);
        return "error";
      }
    },

    async markAsRead(userId: string, notificationId: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.sadd(
          `${KEY.USER}${userId}:notifications:read`,
          notificationId
        );
      } catch (error) {
        logger.error("Error marking notification as read:", error);
      }
    },

    async isRead(userId: string, notificationId: string): Promise<boolean> {
      try {
        const redis = getRedisClient();
        return (
          (await redis.sismember(
            `${KEY.USER}${userId}:notifications:read`,
            notificationId
          )) === 1
        );
      } catch (error) {
        logger.error("Error checking if notification is read:", error);
        return false;
      }
    },
  },

  // Real-time Analytics
  analytics: {
    async incrementCounter(key: string, increment: number = 1): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.hincrby(`${KEY.ANALYTICS}counters`, key, increment);
      } catch (error) {
        logger.error("Error incrementing analytics counter:", error);
      }
    },

    async getCounter(key: string): Promise<number> {
      try {
        const redis = getRedisClient();
        const count = await redis.hget(`${KEY.ANALYTICS}counters`, key);
        return count ? parseInt(count, 10) : 0;
      } catch (error) {
        logger.error("Error getting analytics counter:", error);
        return 0;
      }
    },

    async recordEvent(eventType: string, data: any = {}): Promise<void> {
      try {
        const redis = getRedisClient();
        const now = Date.now();
        const event = {
          timestamp: now,
          type: eventType,
          data,
        };

        // Record event with timestamp
        const date = new Date(now).toISOString().split("T")[0]; // YYYY-MM-DD
        await redis.zadd(
          `${KEY.ANALYTICS}events:${date}`,
          now,
          JSON.stringify(event)
        );

        // Update counters
        await this.incrementCounter(`event:${eventType}`);
        await this.incrementCounter(`event:${eventType}:${date}`);
      } catch (error) {
        logger.error("Error recording analytics event:", error);
      }
    },

    async getEvents(
      eventType: string,
      startTime: number,
      endTime: number,
      limit: number = 100
    ): Promise<any[]> {
      try {
        const redis = getRedisClient();
        const startDate = new Date(startTime).toISOString().split("T")[0];
        const endDate = new Date(endTime).toISOString().split("T")[0];

        // If same day, simple query
        if (startDate === endDate) {
          const events = await redis.zrangebyscore(
            `${KEY.ANALYTICS}events:${startDate}`,
            startTime,
            endTime,
            "LIMIT",
            0,
            limit
          );
          return events.map((e) => JSON.parse(e));
        }

        // Spanning multiple days - more complex
        // This is simplified, a real implementation might use Lua scripts for better performance
        let allEvents: any[] = [];
        let currentDate = new Date(startTime);
        const lastDate = new Date(endTime);

        while (currentDate <= lastDate && allEvents.length < limit) {
          const dateKey = currentDate.toISOString().split("T")[0];
          let dayStart = currentDate.getTime();
          let dayEnd = endTime;

          if (currentDate.toISOString().split("T")[0] !== endDate) {
            // If not the last day, get all events for the day
            dayEnd =
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate() + 1
              ).getTime() - 1;
          }

          const events = await redis.zrangebyscore(
            `${KEY.ANALYTICS}events:${dateKey}`,
            dayStart,
            dayEnd,
            "LIMIT",
            0,
            limit - allEvents.length
          );

          allEvents = [...allEvents, ...events.map((e) => JSON.parse(e))];
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return allEvents;
      } catch (error) {
        logger.error("Error getting analytics events:", error);
        return [];
      }
    },
  },

  // Temporary Data Storage
  tempData: {
    async set(key: string, data: any, ttl = TEMP_DATA_TTL): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.set(`${KEY.TEMP}${key}`, JSON.stringify(data), "EX", ttl);
      } catch (error) {
        logger.error("Error setting temporary data:", error);
      }
    },

    async get(key: string): Promise<any> {
      try {
        const redis = getRedisClient();
        const result = await redis.get(`${KEY.TEMP}${key}`);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        logger.error("Error getting temporary data:", error);
        return null;
      }
    },

    async delete(key: string): Promise<void> {
      try {
        const redis = getRedisClient();
        await redis.del(`${KEY.TEMP}${key}`);
      } catch (error) {
        logger.error("Error deleting temporary data:", error);
      }
    },
  },
};
