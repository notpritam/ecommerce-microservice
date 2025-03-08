import { gql } from "graphql-tag";
import { userTypes } from "./user.typeDefs";
import { notificationTypes } from "./notification.typeDefs";
import { activityTypeDefs } from "./activity.typeDefs";

const baseSchema = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  scalar JSON
`;

export const typeDefs = [
  baseSchema,
  userTypes,
  notificationTypes,
  activityTypeDefs,
];
