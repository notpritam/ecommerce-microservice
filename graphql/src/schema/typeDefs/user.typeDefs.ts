import gql from "graphql-tag";

export const userTypeDefs = gql`
    # User Preferences Enum

    enum NotificationType {
        PROMOTIONS
        ORDER_UPDATE
        RECOMMENDATION
        ALL
    }

    type User {
        id: ID!
        name: String!
        email: String!
        preferences: [NotificationType!] = [ALL]
    }

    # User Input Types

    input RegisterUserInput {
        name: String!
        email: String!
        preferences: [NotificationType!] = [ALL]
        password: String!
    }

    input LoginUserInput {
        email: String!
        password: String!
    }

    input UpdateUserPreferencesInput {
        preferences: [NotificationType!]!
    }

    # User Response Types

    type UserResponse implements Response {
        success: Boolean!
        message: String!
        user: User
    }

    type AuthResponse implements Response {
        success: Boolean!
        message: String!
        token: String
        user: User
    }

    # User Query Types

    extend type Query {
        me: UserResponse! @auth
        user(id: ID!): UserResponse! @auth
        users(pagination: PaginationInput): [User!]! @auth
    }

    # User Mutation Types

    extend type Mutation {
        register(input: RegisterUserInput!): AuthResponse!
        login(input: LoginUserInput!): AuthResponse!
        updateUserPreferences(input: UpdateUserPreferencesInput!): UserResponse! @auth
    }



`;
