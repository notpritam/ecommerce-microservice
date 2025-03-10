import gql from "graphql-tag";

export const activityTypeDefs = gql`
  enum ActivityType {
    VIEW_PRODUCT
    ADD_TO_CART
    ADD_TO_WISHLIST
    PURCHASE
    SEARCH
  }

  input TrackActivityInput {
    productId: ID
    categories: [String]
    searchQuery: String
    activityType: ActivityType!
    metadata: JSON
  }

  type TrackActivityResponse {
    success: Boolean!
    message: String
  }

  type Product {
    id: ID!
    name: String!
    description: String
    images: [String]
    price: Float!
    categories: [String]
    tags: [String]
    inStock: Boolean!
    createdAt: String!
  }

  extend type Mutation {
    trackActivity(input: TrackActivityInput!): TrackActivityResponse!
  }

  type UserActivity {
    id: ID!
    productId: ID
    categoryId: ID
    searchQuery: String
    activityType: ActivityType!
    timestamp: String!
    product: Product
    category: String
  }

  extend type Query {
    userRecentActivities(limit: Int = 10): [UserActivity!]!
  }
`;
