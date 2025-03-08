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
    categoryId: ID
    searchQuery: String
    activityType: ActivityType!
    metadata: JSON
  }

  type TrackActivityResponse {
    success: Boolean!
    message: String
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
    timestamp: DateTime!
    # Include product/category information if available
    product: Product
    category: Category
  }

  extend type Query {
    userRecentActivities(limit: Int = 10): [UserActivity!]!
  }
`;
