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
});

const startServer = async () => {
  try {
    await server.start();
    console.log("Apollo Server started successfully!");

    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // Allowing 100 request in a min
      max: 100,
      keyGenerator: (req: any): any => {
        return req.user?.id || req.ip || req.headers["x-forwarded-for"];
      },
      skip: (req: any): boolean => {
        return req.user?.role === "admin"; // Allowing admin role to skip the rate limit
      },
    });

    // I am  applying the Appolo GraphQL middleware at the GRAPHQL_PATH
    app.use(
      GRAPHQL_PATH,

      expressMiddleware(server, {
        context: async ({ req, res }) => {
          return {
            req,
            res,
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

startServer();
