import { gql } from "graphql-tag";

export const userTypes = gql`
  type UserPreferences {
    promotions: Boolean!
    order_updates: Boolean!
    recommendations: Boolean!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    preferences: UserPreferences!
    role: String
    createdAt: String
    updatedAt: String
  }

  input UserPreferencesInput {
    promotions: Boolean
    order_updates: Boolean
    recommendations: Boolean
  }

  input RegisterUserInput {
    name: String!
    email: String!
    password: String!
    preferences: UserPreferencesInput
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    preferences: UserPreferencesInput
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  extend type Query {
    me: User
    getUser(id: ID!): User
    getAllUsers: [User!]!
  }

  extend type Mutation {
    register(input: RegisterUserInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;
