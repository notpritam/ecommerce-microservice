import { Request, Response } from "express";
import Notification from "../models/notification.model";
import logger from "../config/logger";
import kafkaProducer from "../kafka/producers/producer";

export class NotificationController {
  public async createNotification(req: Request, res: Response): Promise<any> {
    try {
      console.log("req.body", req.body);
      const { userId, type, content, expiresAt } = req.body;

      console.log("userId", userId);

      if (!userId || !type || !content || !expiresAt) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notification = new Notification({
        userId,
        type,
        content,
        expiresAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        read: false,
        sentAt: new Date(),
      });

      await notification.save();

      // I am now pushing the notification to the Kafka topic so other service can consume it

      // await kafkaProducer.send({
      //   topic: "notification",
      //   messages: [
      //     {
      //       key: userId,
      //       value: JSON.stringify({
      //         id: notification._id,
      //         userId: notification.userId,
      //         type: notification.type,
      //         content: notification.content,
      //         sentAt: notification.sentAt,
      //       }),
      //     },
      //   ],
      // });

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

  public async getUserNotifications(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;

      console.log("userId", userId);

      if (!userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notifications = await Notification.find({
        userId: userId,
      });

      console.log("notifications", notifications);

      return res.status(200).json({
        success: true,
        data: notifications,
        message: "Notifications fetched successfully",
      });
    } catch (error: any) {
      logger.error("Error fetching notifications", error.message);
      return res
        .status(500)
        .json({ message: "Failed to fetch notifications", success: false });
    }
  }

  public async markAsRead(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await Notification.updateMany(
        { userId: userId },
        { read: true },
        { multi: true }
      );

      return res.status(200).json({
        success: true,
        message: "Notifications marked as read successfully",
      });
    } catch (error: any) {
      logger.error("Error marking notifications as read", error.message);
      return res.status(500).json({
        message: "Failed to mark notifications as read",
        success: false,
      });
    }
  }

  public async markNotificationAsRead(
    req: Request,
    res: Response
  ): Promise<any> {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await Notification.updateOne({ _id: notificationId }, { read: true });

      return res.status(200).json({
        success: true,
        message: "Notification marked as read successfully",
      });
    } catch (error: any) {
      logger.error("Error marking notification as read", error.message);
      return res.status(500).json({
        message: "Failed to mark notification as read",
        success: false,
      });
    }
  }

  public async deleteNotification(req: Request, res: Response): Promise<any> {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await Notification.deleteOne({ _id: notificationId });

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      logger.error("Error deleting notification", error.message);
      return res
        .status(500)
        .json({ message: "Failed to delete notification", success: false });
    }
  }

  public async getUnreadCount(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const count = await Notification.countDocuments({
        userId: userId,
        read: false,
      });

      return res.status(200).json({
        success: true,
        data: count,
        message: "Unread notifications count fetched successfully",
      });
    } catch (error: any) {
      logger.error("Error fetching unread notifications count", error.message);
      return res.status(500).json({
        message: "Failed to fetch unread notifications count",
        success: false,
      });
    }
  }

  public async getNotificationsByType(
    req: Request,
    res: Response
  ): Promise<any> {
    try {
      const { userId, type } = req.params;

      if (!userId || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const notifications = await Notification.find({
        userId: userId,
        type: type,
      });

      // TODO : add in cache of redis so we can access it faster

      return res.status(200).json({
        success: true,
        data: notifications,
        message: "Notifications fetched successfully",
      });
    } catch (error: any) {
      logger.error("Error fetching notifications", error.message);
      return res
        .status(500)
        .json({ message: "Failed to fetch notifications", success: false });
    }
  }
}
