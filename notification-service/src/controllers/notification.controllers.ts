import { Request, Response } from "express";
import Notification from "../models/notification.model";
import logger from "../config/logger";
import kafkaProducer from "../kafka/producers/producer";
import { Types } from "mongoose";

class NotificationController {
  public async createNotification(req: Request, res: Response) {
    try {
      const { userId, type, content, expiresAt } = req.body;

      if (!userId || !type || !content || !expiresAt) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notification = new Notification({
        userId,
        type,
        content,
        expiresAt,
        read: false,
        sentAt: new Date(),
      });

      await notification.save();

      // I am now pushing the notification to the Kafka topic so other service can consume it

      await kafkaProducer.send({
        topic: "notification",
        messages: [
          {
            key: userId,
            value: JSON.stringify({
              id: notification._id,
              userId: notification.userId,
              type: notification.type,
              content: notification.content,
              sentAt: notification.sentAt,
            }),
          },
        ],
      });

      // TODO : now i will need to store this notification in the redis database to access it faster

      return res.status(201).json({
        success: true,
        data: notification,
        message: "Notification created successfully",
      });
    } catch (error: any) {
      logger.error("Error creating notification", error.message);
      return res
        .status(500)
        .json({ message: "Failed to create notification", success: false });
    }
  }
}
