import { Router } from "express";
import { NotificationController } from "../controllers/notification.controllers";

const notificationController = new NotificationController();

const router = Router();

router.post("/", notificationController.createNotification);
router.get("/user/:userId", notificationController.getUserNotifications);
router.put("/user/:userId/read", notificationController.markAsRead);
router.put(
  "/:notificationId/read",
  notificationController.markNotificationAsRead
);
router.delete("/:notificationId", notificationController.deleteNotification);
router.get("/user/:userId/unread", notificationController.getUnreadCount);
router.get(
  "/user/:userId/type/:type",
  notificationController.getNotificationsByType
);

export default router;
