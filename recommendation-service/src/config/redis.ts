import Redis from "ioredis";
import { ActivityType } from "../models/userActivity.model";
import logger from "./logger";

interface ActivityData {
  productId?: string;
  categoryId?: string;
  activityType: ActivityType;
  timestamp: number;
  weight: number;
  metadata?: Record<string, any>;
}

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      logger.error("Redis Client Error", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      logger.info("Redis Client Connected");
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    this.isConnected = this.client.status === "ready";
    if (!this.isConnected) {
      // Wait for connection to be ready
      await new Promise<void>((resolve) => {
        this.client.once("ready", () => {
          this.isConnected = true;
          resolve();
        });
      });
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
    logger.info("Redis Client Disconnected");
  }

  // Storing user activity in Redis using sorted sets
  // Key format i am using : user:{userId}:activity
  async storeUserActivity(
    userId: string,
    activity: ActivityData
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:activity`;
    const activityData = JSON.stringify({
      productId: activity.productId,
      categoryId: activity.categoryId,
      activityType: activity.activityType,
      weight: activity.weight,
      metadata: activity.metadata,
    });

    try {
      // I am adding to sorted set with timestamp as score here
      await this.client.zadd(key, activity.timestamp, activityData);

      // Set TTL of 48 hours (172800 seconds)
      await this.client.expire(key, 172800);

      // defining size for the sorted set (keep last 100 activities) so we don't have a lot of data in redis
      await this.client.zremrangebyrank(key, 0, -101);

      // Also store in product-specific key if productId exists
      if (activity.productId) {
        const productKey = `product:${activity.productId}:viewed_by`;
        await this.client.zadd(productKey, activity.timestamp, userId);
        await this.client.expire(productKey, 172800);
        await this.client.zremrangebyrank(productKey, 0, -101);
      }
    } catch (error) {
      logger.error("Error storing user activity in Redis", { userId, error });
      throw error;
    }
  }

  // Get recent user activities
  async getUserRecentActivities(
    userId: string,
    limit: number = 50
  ): Promise<ActivityData[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:activity`;

    try {
      // Get the most recent activities (highest scores)
      const results = await this.client.zrevrange(
        key,
        0,
        limit - 1,
        "WITHSCORES"
      );

      const activities: ActivityData[] = [];

      for (let i = 0; i < results.length; i += 2) {
        const dataStr = results[i];
        const scoreStr = results[i + 1];

        try {
          if (!dataStr || !scoreStr) {
            continue;
          }

          const data = JSON.parse(dataStr);
          const score = parseFloat(scoreStr);

          activities.push({
            ...data,
            timestamp: score,
          });
        } catch (e) {
          logger.error("Error parsing activity data", { dataStr, error: e });
        }
      }

      return activities;
    } catch (error) {
      logger.error("Error retrieving user activities from Redis", {
        userId,
        error,
      });
      return [];
    }
  }

  // Storing user interest scores in Redis hash here
  // Key format i am using : user:{userId}:interests:{type} (type is 'product' or 'category')
  async storeUserInterests(
    userId: string,
    type: "product" | "category",
    interests: Record<string, number>
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:interests:${type}`;

    try {
      // Delete existing hash first
      await this.client.del(key);

      if (Object.keys(interests).length > 0) {
        // With ioredis, we need to flatten the object into args array
        const args: (string | number)[] = [];

        for (const [itemId, score] of Object.entries(interests)) {
          args.push(itemId, score.toString());
        }

        if (args.length > 0) {
          await this.client.hmset(key, ...args);
          // Set TTL of 7 days (604800 seconds)
          await this.client.expire(key, 604800);
        }
      }
    } catch (error) {
      logger.error("Error storing user interests in Redis", {
        userId,
        type,
        error,
      });
      throw error;
    }
  }

  // Get user interest scores
  async getUserInterests(
    userId: string,
    type: "product" | "category"
  ): Promise<Record<string, number>> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:interests:${type}`;

    try {
      const results = await this.client.hgetall(key);

      // Convert string scores back to numbers
      const interests: Record<string, number> = {};
      for (const [itemId, scoreStr] of Object.entries(results)) {
        interests[itemId] = parseFloat(scoreStr);
      }

      return interests;
    } catch (error) {
      logger.error("Error retrieving user interests from Redis", {
        userId,
        type,
        error,
      });
      return {};
    }
  }

  // Get recently viewed products by a specific user
  async getRecentlyViewedProducts(
    userId: string,
    limit: number = 10
  ): Promise<string[]> {
    const activities = await this.getUserRecentActivities(userId);

    // Filter for unique product views, most recent first
    const viewedProducts = new Set<string>();
    const results: string[] = [];

    for (const activity of activities) {
      if (
        activity.productId &&
        (activity.activityType === ActivityType.VIEW_PRODUCT ||
          activity.activityType === ActivityType.ADD_TO_CART ||
          activity.activityType === ActivityType.ADD_TO_WISHLIST)
      ) {
        if (!viewedProducts.has(activity.productId)) {
          viewedProducts.add(activity.productId);
          results.push(activity.productId);

          if (results.length >= limit) {
            break;
          }
        }
      }
    }

    return results;
  }

  // Marking notification as sent to avoid duplicate recommendations
  async markRecommendationSent(
    userId: string,
    productIds: string[]
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:sent_recommendations`;
    const now = Date.now();

    try {
      const pipeline = this.client.pipeline();

      for (const productId of productIds) {
        pipeline.zadd(key, now, productId);
      }

      // Set TTL of 7 days (604800 seconds)
      pipeline.expire(key, 604800);

      await pipeline.exec();
    } catch (error) {
      logger.error("Error marking recommendations as sent", { userId, error });
    }
  }

  // Check if recommendation was recently sent
  async wasRecommendationSent(
    userId: string,
    productId: string,
    withinHours: number = 72
  ): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    const key = `user:${userId}:sent_recommendations`;
    const cutoffTime = Date.now() - withinHours * 60 * 60 * 1000;

    try {
      const score = await this.client.zscore(key, productId);

      if (score === null) {
        return false;
      }

      return parseFloat(score) > cutoffTime;
    } catch (error) {
      logger.error("Error checking if recommendation was sent", {
        userId,
        productId,
        error,
      });
      return false;
    }
  }
}

export const redisService = new RedisService();
