import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import ENV from "./config/env";
import logger from "./config/logger";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import express from "express";
import http from "http";
import cors from "cors";
import { Request, Response } from "express";
import { createRateLimiter } from "./middleware/rateLimiter";
import { authMiddleware } from "./middleware/auth";
import { initRedis } from "./config/redis";
import { IUser } from "./types/user.types";
import { errorHandler, ValidationError } from "./middleware/errorHandler";

const GRAPHQL_PATH = "/graphql";
const PORT = ENV.port || 4000;

const app = express() as any;
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.use("/health", (req: Request, res: Response) => {
  res.send("OK");
});

const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error: any) => {
    const originalError =
      error instanceof Error ? error : new Error(error.message);

    if (originalError instanceof ValidationError) {
      return {
        message: originalError.message,
        extensions: {
          code: "BAD_USER_INPUT",
          http: { status: 400 },
        },
      };
    }

    // For production, don't expose the stacktrace for other errors
    if (process.env.NODE_ENV === "production") {
      // Return a sanitized error
      return {
        message: originalError.message || "An error occurred",
        extensions: {
          code: formattedError.extensions?.code || "INTERNAL_SERVER_ERROR",
        },
      };
    }

    return formattedError;
  },
});

const startServer = async () => {
  try {
    await server.start();
    await initRedis();
    console.log("Apollo Server started successfully!");

    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // Allowing 100 request in a min
      max: 100,
      keyGenerator: (req: any): any => {
        return req.user?.id || req.ip || req.headers["x-forwarded-for"];
      },
      skip: (req: any): boolean => {
        return req.user?.role === "admin"; // Allowing admin role to skip
      },
    });

    // I am  applying the Appolo GraphQL middleware at the GRAPHQL_PATH
    app.use(
      GRAPHQL_PATH,
      authMiddleware,
      rateLimiter,
      expressMiddleware(server, {
        context: async ({ req }) => {
          return {
            user: req.user as IUser,
          };
        },
      })
    );

    app.use(errorHandler);

    // Starting the HTTP server
    await new Promise<void>((resolve) =>
      httpServer.listen({ port: PORT }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:${PORT}${GRAPHQL_PATH}`);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
};

startServer().catch((error) => {
  logger.error(`Error starting server: ${error}`);
  process.exit(1);
});
