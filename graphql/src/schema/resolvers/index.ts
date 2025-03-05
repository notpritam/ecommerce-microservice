import { GraphQLScalarType, Kind } from "graphql";
import { userResolvers } from "./user.resolvers";

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "The JSON scalar type represents JSON objects as JSON strings",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch (error) {
        return null;
      }
    }
    if (ast.kind === Kind.OBJECT) {
      throw new Error("Not implemented yet");
    }
    return null;
  },
});

// Merge all resolvers
export const resolvers = {
  JSON: JSONScalar,
  Query: {
    _: () => true,
    ...userResolvers.Query,
  },
  Mutation: {
    _: () => true,
    ...userResolvers.Mutation,
  },
  //   Subscription: {
  //     ...notificationResolvers.Subscription,
  //   },
  // ...userResolvers.Types,
};
