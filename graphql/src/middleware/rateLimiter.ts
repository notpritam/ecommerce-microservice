import { Request, Response } from "express";
import logger from "../config/logger";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
}

export const createRateLimiter = (options: Partial<RateLimitConfig>) => {
  const config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator:
      options.keyGenerator ||
      ((req: Request): any => {
        return (
          req.ip ||
          (req.headers["x-forwarded-for"] as string) ||
          req.connection.remoteAddress
        );
      }),
    handler:
      options.handler ||
      ((req: Request, res: Response) => {
        res.status(429).send({
          error: "Too many requests, please try again later.",
        });
      }),
    skip: options.skip || ((req: Request) => false),
    headers: options.headers || true,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  };

  return async (req: Request, res: Response, next: () => void) => {
    if (config.skip && config.skip(req)) {
      return next();
    }

    try {
      const key = config.keyGenerator(req);

      const windowSecs = Math.ceil(config.windowMs / 1000);

      // Todo Implement Result from RedisService Here

      const result = {
        total: 0,
        remaining: 0,
        reset: 0,
        isRateLimited: false,
      };

      if (config.headers) {
        res.setHeader("X-RateLimit-Limit", config.max);
        res.setHeader("X-RateLimit-Remaining", Math.max(config.max - 1, 0));
        res.setHeader(
          "X-RateLimit-Reset",
          String(Math.ceil(Date.now() / 1000) + windowSecs)
        );
      }

      if (result.isRateLimited) {
        logger.warn(`Rate limit exceeded for ${key} at ${windowSecs} seconds`);
        if (config.handler) {
          return config.handler(req, res);
        }
      }
      // Todo : Add a way to skip successful request

      //   if (config.skipSuccessfulRequests) {
      //     const originalEnd = res.end;

      //   }

      next();
    } catch (error) {
      logger.error("Error in rate limiter middleware", error);

      // I am allowing the request to continue even if the rate limiter fails

      next();
    }
  };
};
