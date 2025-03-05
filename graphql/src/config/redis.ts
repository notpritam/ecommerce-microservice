import Redis, { RedisOptions } from "ioredis";
import logger from "./logger";
import ENV from "./env";

const REDIS_HOST = ENV.redis.host;
const REDIS_PORT = ENV.redis.port;
const REDIS_PASSWORD = ENV.redis.password;

let redisClient: Redis | null = null;

export const initRedis = async (): Promise<Redis> => {
  try {
    if (redisClient) return redisClient;

    const options: RedisOptions = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: true,
    };

    if (REDIS_PASSWORD) {
      options.password = REDIS_PASSWORD;
    }

    redisClient = new Redis(options);

    redisClient.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    redisClient.on("error", (error) => {
      logger.error("Redis connection error:", error);
    });

    redisClient.on("reconnecting", () => {
      logger.warn("Redis reconnecting...");
    });

    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis:", error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  return redisClient;
};
