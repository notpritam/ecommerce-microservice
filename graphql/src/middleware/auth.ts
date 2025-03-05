import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import ENV from "../config/env";
import logger from "../config/logger";
import { RedisService } from "../services/redis.service";
import { IUser } from "../types/user.types";

// Extending express request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// JWT Configuration
const JWT_SECRET: jwt.Secret = ENV.jwt_secret;
const JWT_EXPIRATION = ENV.jwt_expiration;
const REFRESH_TOKEN_EXPIRATION = ENV.refresh_token_expiration;

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without authentication
      logger.info("No token provided, continuing without authentication");
      return next();
    }

    // Format should be: "Bearer [token]"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(
        new AuthError("Invalid authorization format, expected: Bearer [token]")
      );
    }

    const token = parts[1];

    try {
      // Verify the token

      const decoded = jwt.verify(token as string, JWT_SECRET) as any;

      // Check if token is in blacklist (for logged out tokens)
      const isBlacklisted = await RedisService.tempData.get(
        `token:blacklist:${token}`
      );
      if (isBlacklisted) {
        throw new AuthError("Token has been revoked");
      }

      // Check if user session is valid
      const session = await RedisService.sessionStore.get(
        `session:${decoded.id}`
      );

      if (!session) {
        throw new AuthError("Session expired, please login again");
      }

      // Set the user in the request object
      req.user = decoded;
      req.token = token;

      // Extend session TTL
      await RedisService.sessionStore.extend(`session:${decoded.id}`);

      return next();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError("Token expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError("Invalid token");
      }

      logger.error("JWT verification error:", error);
      throw new AuthError("Authentication failed");
    }
  } catch (error) {
    // Pass authentication errors to next middleware but don't block unauthenticated requests
    if (error instanceof AuthError) {
      req.user = undefined;
      req.token = undefined;
      // Only log errors but continue to allow unauthenticated access to public resolvers
      logger.warn(`Auth warning: ${error.message}`);
    }

    next();
  }
};

// Helper functions for resolvers
export const isAuthenticated = (context: any): IUser => {
  if (!context.user) {
    throw new AuthError("Authentication required");
  }
  return context.user;
};

export const hasRole = (context: any, requiredRole: string | string[]) => {
  const user = isAuthenticated(context);

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!user.role || !roles.includes(user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }

  return user;
};

export const generateTokens = async (user: any) => {
  // Remove sensitive information
  const { password, ...userInfo } = user;

  // Generate access token
  const accessToken = jwt.sign(
    userInfo,
    JWT_SECRET as jwt.Secret,
    {
      expiresIn: JWT_EXPIRATION,
    } as SignOptions
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: user.id, tokenType: "refresh" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  // Store session data in Redis
  await RedisService.sessionStore.set(
    `session:${user.id}`,
    {
      refreshToken,
      lastActivity: Date.now(),
    },
    REFRESH_TOKEN_EXPIRATION
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    // Make sure it's a refresh token
    if (decoded.tokenType !== "refresh") {
      throw new AuthError("Invalid token type");
    }

    // Check if session exists
    const session = await RedisService.sessionStore.get(
      `session:${decoded.id}`
    );
    if (!session || session.refreshToken !== refreshToken) {
      throw new AuthError("Invalid refresh token");
    }

    // Get user from cache or database
    const user = await RedisService.userCache.get(decoded.id);
    if (!user) {
      throw new AuthError("User not found");
    }
    const tokenData = { id: user.id, email: user.email, role: user.role };

    // Generate new access token
    const accessToken = jwt.sign(
      tokenData,
      JWT_SECRET as jwt.Secret,
      {
        expiresIn: JWT_EXPIRATION,
      } as SignOptions
    );

    // Update session last activity
    await RedisService.sessionStore.set(
      `session:${user.id}`,
      {
        ...session,
        lastActivity: Date.now(),
      },
      REFRESH_TOKEN_EXPIRATION
    );

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Refresh token expired");
    }

    if (error instanceof AuthError) {
      throw error;
    }

    logger.error("Error refreshing token:", error);
    throw new AuthError("Failed to refresh token");
  }
};

export const revokeToken = async (userId: string, token: string) => {
  try {
    // Add token to blacklist until it expires
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return false;
    }

    // Calculate TTL in seconds (token expiration - current time)
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(0, decoded.exp - now);

    // Add to blacklist
    await RedisService.tempData.set(`token:blacklist:${token}`, true, ttl);

    // Remove session
    await RedisService.sessionStore.delete(`session:${userId}`);

    return true;
  } catch (error) {
    logger.error("Error revoking token:", error);
    return false;
  }
};
