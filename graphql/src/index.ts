import { ApolloServer } from "@apollo/server";

import { startStandaloneServer } from "@apollo/server/standalone";
import ENV from "./config/env";
import logger from "./config/logger";

const typeDefs = `
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      books: () => [
        {
          title: "Harry Potter and the Chamber of Secrets",
          author: "J.K. Rowling",
        },
      ],
    },
  },
});

const startServer = async () => {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: ENV.port },
    });

    logger.info(`Server ready at ${url}`);
  } catch (error) {
    logger.error(`Error starting server: ${error}`);
  }
};

startServer();

logger.info(`Server ready at http://localhost:${ENV.port}/graphql`);
