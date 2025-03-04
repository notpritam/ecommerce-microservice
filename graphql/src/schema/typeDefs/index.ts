import { gql } from "graphql-tag";
import { userTypeDefs } from "./user.typeDefs";

const baseSchema = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  scalar JSON
`;

export const typeDefs = [baseSchema, userTypeDefs];
