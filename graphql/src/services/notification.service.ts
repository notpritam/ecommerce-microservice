import { NotificationServiceClient } from "../clients/notification.client";
import logger from "../config/logger";
import { NotFoundError } from "../middleware/errorHandler";
import { IApiResponse } from "../types";
import { INotification } from "../types/notification.types";

class NotificationService {
  private notificationClient: NotificationServiceClient;

  constructor() {
    this.notificationClient = new NotificationServiceClient();
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    try {
      logger.info("Get user notifications:", userId);
      return await this.notificationClient.getNotificationsByUserId(userId);
    } catch (error) {
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      logger.info("Get unread notification count:", userId);
      const response: IApiResponse<number> =
        await this.notificationClient.getUnreadCount(userId);

      console.log("notificationCount", response);

      // Make sure we return a valid number, even if the response is unexpected
      if (response && response.data !== undefined && response.data !== null) {
        return response.data;
      } else {
        logger.warn(`No valid unread count data returned for user ${userId}`);
        return 0; // Return 0 as a default value if data is missing
      }
    } catch (error) {
      logger.error(
        `Error getting unread notification count for ${userId}:`,
        error
      );
      // Return 0 instead of throwing, so GraphQL doesn't fail on this non-nullable field
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
