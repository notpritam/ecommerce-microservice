import gql from "graphql-tag";

export const notificationTypes = gql`
  enum NotificationType {
    promotion
    order_update
    recommendation
  }

  scaler JSON

  type Notification {
    _id: ID!
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
  }

  input NotificationFilterInput {
    userId: ID
    type: NotificationType
    read: Boolean
    startDate: String
    endDate: String
  }

  type NotificationPage{
    notifications: [Notification!]!
    total: Int!
    hasNexPage: Boolean!
  }

  type NotificationStats {
    totalCount: Int!
    unreadCount: Int!
    readCount: Int!
    byType: NotificationTypeStats!
  }

  extend type Query {
    getNotification(id: ID!): Notification
    getNotifications(filter: NotificationFilterInput, limit: Int, page: Int): NotificationPage
    getNotificationStats(userID: ID!): NotificationStats!
    getUserNotification(userID: ID!, limit: Int, offset: Int): [Notification!]!
  }

  extend type Mutation {
    createNotification(input: NotificationInput!): Notification!
    markAsRead(id: ID!): Notification!
    markAllAsRead(userID: ID!): Boolean!
    deleteNotification(id: ID!): Boolean!
  }

`;
