import { Request, Response } from "express";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
}

export const createRateLimiter = (config: RateLimitConfig) => {};
