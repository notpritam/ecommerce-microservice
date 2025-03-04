import { ApolloServer } from "@apollo/server";

import { startStandaloneServer } from "@apollo/server/standalone";
import ENV from "./config/env";
import logger from "./config/logger";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
});

const startServer = async () => {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: ENV.port },
    });

    logger.info(`🚀 GraphQL Gateway ready at: ${url}`);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
};

startServer();

logger.info(`Server ready at http://localhost:${ENV.port}/graphql`);

console.log("Hello, world from GraphQL!");
