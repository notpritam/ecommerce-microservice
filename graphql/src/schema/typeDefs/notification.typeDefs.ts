import gql from "graphql-tag";

export const notificationTypes = gql`
  enum NotificationType {
    promotion
    order_update
    recommendation
  }

  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    content: JSON!
    read: Boolean!
    sentAt: String!
    expiresAt: String
  }

  input NotificationInput {
    userId: ID!
    type: NotificationType!
    content: JSON!
    expiresAt: String!
  }

  input NotificationFilterInput {
    userId: ID
    type: NotificationType
    read: Boolean
    startDate: String
    endDate: String
  }

  type NotificationPage {
    notifications: [Notification!]!
    total: Int!
    hasNexPage: Boolean!
  }

  type NotificationResponse {
    success: Boolean!
    message: String
  }

  extend type Query {
    getUserNotifications(userID: ID!, limit: Int, offset: Int): [Notification!]!
    getUnreadNotificationCount(userID: ID!): Int!
    markAsRead(userID: ID!): NotificationResponse!
    markNotificationAsRead(notificationID: ID!): NotificationResponse!
  }

  extend type Mutation {
    createNotification(input: NotificationInput!): Notification!
  }
`;
