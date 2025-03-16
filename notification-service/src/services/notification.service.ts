import { producer } from "../config/kafka";
import logger from "../config/logger";
import Notification, { INotification } from "../models/notification.model";
import { OrderStatus } from "../types/order";

export interface IOrderUpdate {
  orderId: string;
  status: OrderStatus;
  userId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedAt: Date;
}
class NotificationService {
  constructor() {}

  async sendNotification(data: { notificationId: string }): Promise<void> {
    try {
      logger.info("Sending notification:", data.notificationId);
      const notification = await Notification.findById(data.notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Send notification to user
      logger.info("Sending notification to user:", notification.userId);

      await Notification.findByIdAndUpdate(data.notificationId, {
        sentAt: new Date(),
      });
    } catch (error) {
      logger.error("Error sending notification:", error);
      throw error;
    }
  }

  async handleOrderStatusChange(data: IOrderUpdate): Promise<void> {
    try {
      logger.info("Handling order status change:", data);
      const notification = await Notification.create({
        userId: data.userId,
        title: "Order status updated",
        content: `Your order status has been updated from ${data.oldStatus} to ${data.newStatus}`,
        read: false,
        type: "order_update",
      });

      await notification.save();

      await producer.send({
        topic: "notification.tasks",
        messages: [
          {
            value: JSON.stringify({
              taskName: "send-notification",
              data: {
                notificationId: notification._id,
              },
            }),
          },
        ],
      });
      return;
    } catch (error) {
      logger.error("Error handling order status change:", error);
    }
  }
}

const notificationService = new NotificationService();

export default notificationService;
