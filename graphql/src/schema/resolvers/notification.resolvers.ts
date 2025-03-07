import logger from "../../config/logger";
import { isAuthenticated } from "../../middleware/auth";
import NotificationService from "../../services/notification.service";

enum NotificationType {
  PROMOTION = "promotion",
  ORDER_UPDATE = "order_update",
  RECOMMENDATION = "recommendation",
}
interface INotificationInput {
  userID: string;
  type: NotificationType;
  content: string;
  expiresAt: Date;
}

export const notificationResolvers = {
  Query: {
    getUserNotifications: async (
      _: any,
      { userID }: { userID: string },
      context: any
    ) => {
      try {
        isAuthenticated(context);

        return await NotificationService.getUserNotifications(userID);
      } catch (error) {
        logger.error(
          `Error in getNotification resolver for ID ${userID}:`,
          error
        );
        throw error;
      }
    },
    getUnreadNotificationCount: async (
      _: any,
      { userId }: { userId: string },
      context: any
    ) => {
      try {
        isAuthenticated(context);

        const data = await NotificationService.getUnreadNotificationCount(
          userId
        );

        console.log("data", data);

        return data;
      } catch (error) {
        logger.error(
          `Error in getUnreadNotificationCount resolver for ID ${userId}:`,
          error
        );
        throw error;
      }
    },
    markAsRead: async (
      _: any,
      { userID }: { userID: string },
      context: any
    ) => {
      try {
        isAuthenticated(context);

        return await NotificationService.markAsRead(userID);
      } catch (error) {
        logger.error(`Error in markAsRead resolver for ID ${userID}:`, error);
        throw error;
      }
    },

    markNotificationAsRead: async (
      _: any,
      { notificationID }: { notificationID: string },
      context: any
    ) => {
      try {
        isAuthenticated(context);

        return await NotificationService.markNotificationAsRead(notificationID);
      } catch (error) {
        logger.error(
          `Error in markNotificationAsRead resolver for ID ${notificationID}:`,
          error
        );
        throw error;
      }
    },
  },

  Mutation: {
    createNotification: async (
      _: any,
      { input }: { input: INotificationInput },
      context: any
    ) => {
      try {
        isAuthenticated(context);

        console.log("input", input);

        return await NotificationService.createNotification(input);
      } catch (error) {
        logger.error(`Error in createNotification resolver:`, error);
        throw error;
      }
    },
  },
};
