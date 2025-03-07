import { Request, Response } from "express";
import Notification from "../models/notification.model";
import logger from "../config/logger";

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
