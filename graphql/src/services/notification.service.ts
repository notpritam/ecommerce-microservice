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

  async getUserNotifications(userID: string): Promise<INotification[]> {
    try {
      const response = await this.notificationClient.getNotificationsByUserId(
        userID
      );

      console.log("response", response);

      return response.data;
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

      if (response && response.data !== undefined && response.data !== null) {
        return response.data;
      } else {
        logger.warn(`No valid unread count data returned for user ${userId}`);
        return 0;
      }
    } catch (error) {
      logger.error(
        `Error getting unread notification count for ${userId}:`,
        error
      );
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
