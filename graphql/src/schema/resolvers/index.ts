import { GraphQLScalarType, Kind } from "graphql";
import { userResolvers } from "./user.resolvers";
import { notificationResolvers } from "./notification.resolvers";
import { activityResolvers } from "./activity.resolvers";
import { orderResolvers } from "./order.resolvers";
import { schedulerResolvers } from "./scheduler.resolvers";

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

export const resolvers = {
  JSON: JSONScalar,
  Query: {
    _: () => true,
    ...userResolvers.Query,
    ...notificationResolvers.Query,
    ...activityResolvers.Query,
    ...orderResolvers.Query,
    ...schedulerResolvers.Query,
  },
  Mutation: {
    _: () => true,
    ...userResolvers.Mutation,
    ...notificationResolvers.Mutation,
    ...activityResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...schedulerResolvers.Mutation,
  },
};
