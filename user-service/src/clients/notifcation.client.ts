import { BaseServiceClient } from "./base.client";
import { INotification } from "../types/notification.types";

export class NotificationServiceClient extends BaseServiceClient {
  constructor() {
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://notification-service:3002";
    super(notificationServiceUrl, "Notification");
  }

  async getNotificationsByUserId(
    userId: string,
    options?: { read?: boolean }
  ): Promise<INotification[]> {
    return this.get<INotification[]>(`/api/notifications/user/${userId}`, {
      params: options,
    });
  }

  async createNotification(
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    return this.post<INotification>("/api/notifications", notificationData);
  }

  async markNotificationAsRead(notificationId: string): Promise<INotification> {
    return this.put<INotification>(
      `/api/notifications/${notificationId}/read`,
      {}
    );
  }
}
