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
import { createRateLimiter } from "./middleware/rateLimiter";
import { authMiddleware } from "./middleware/auth";
import { initRedis } from "./config/redis";
import { ServiceError } from "./middleware/errorHandler";
import { IUser } from "./types/user.types";
import { connectProducer, producer } from "./config/kafka";

const GRAPHQL_PATH = "/graphql";
const PORT = ENV.port || 4000;

const app = express() as any;
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError, error: any) => {
    // Extract the original error
    const originalError = error.originalError;

    // If it's our custom service error, format it properly
    if (originalError instanceof ServiceError) {
      return {
        message: originalError.message,
        extensions: {
          code: originalError.errorType,
          http: { status: originalError.statusCode },
          ...(process.env.NODE_ENV !== "production" && {
            path: formattedError.path,
          }),
        },
      };
    }

    // In production, sanitize unknown errors
    if (process.env.NODE_ENV === "production") {
      return {
        message: "An error occurred",
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          http: { status: 500 },
        },
      };
    }

    // In development, return the full error
    return formattedError;
  },
});

const startServer = async () => {
  try {
    await server.start();
    await initRedis();
    await connectProducer();
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

    // Starting the HTTP server
    await new Promise<void>((resolve) =>
      httpServer.listen({ port: PORT }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:${PORT}${GRAPHQL_PATH}`);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
};

startServer().catch(async (error) => {
  logger.error(`Error starting server: ${error}`);
  await producer.disconnect();
  process.exit(1);
});
