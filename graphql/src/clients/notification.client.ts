import { BaseServiceClient } from "./base.client";
import { INotification } from "../types/notification.types";
import ENV from "../config/env";
import { IApiResponse } from "../types";

export class NotificationServiceClient extends BaseServiceClient {
  constructor() {
    const notificationServiceUrl = ENV.services.notificationServiceURL;
    super(notificationServiceUrl, "Notification");
  }

  async getNotificationsByUserId(
    userId: string,
    options?: { read?: boolean }
  ): Promise<IApiResponse<INotification[]>> {
    const data = await this.get<IApiResponse<INotification[]>>(
      `/user/${userId}`,
      {
        params: options,
      }
    );

    console.log("data", data);

    return data;
  }

  async createNotification(
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    return this.post<INotification>("/", notificationData);
  }

  async markNotificationAsRead(notificationId: string): Promise<INotification> {
    return this.put<INotification>(`/${notificationId}/read`, {});
  }
  async markAsRead(userId: string): Promise<INotification> {
    return this.put<INotification>(`/user/${userId}/read`, {});
  }

  async deleteNotification(notificationId: string): Promise<INotification> {
    return this.delete<INotification>(`/${notificationId}`);
  }

  async getUnreadCount(userId: string): Promise<IApiResponse<number>> {
    return this.get<IApiResponse<number>>(`/user/${userId}/unread`);
  }
}
