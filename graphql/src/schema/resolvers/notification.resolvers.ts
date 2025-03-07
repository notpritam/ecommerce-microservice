import logger from "../../config/logger";
import { isAuthenticated } from "../../middleware/auth";
import NotificationService from "../../services/notification.service";

export const notificationResolvers = {
  Query: {
    getUserNotifications: async (
      _: any,
      { userId }: { userId: string },
      context: any
    ) => {
      try {
        isAuthenticated(context);
        return await NotificationService.getUserNotifications(userId);
      } catch (error) {
        logger.error(
          `Error in getNotification resolver for ID ${userId}:`,
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
      console.log("Calling Resolvers", userId);
      try {
        console.log("userId", userId);

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
  },

  Mutation: {},
};
