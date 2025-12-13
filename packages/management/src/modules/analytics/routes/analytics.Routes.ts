import { Router, Request, Response } from "express";
import DashboardController from "../controllers/DashboardController";
import NotificationController from "../controllers/NotificationController";
import MessageController from "../controllers/MessageController";

const router = Router();

// ========== DASHBOARD ROUTES ==========
router.get("/dashboard", DashboardController.getDashboardData);
router.get("/dashboard/metrics", DashboardController.getDashboardMetrics);
router.get("/dashboard/business", DashboardController.getBusinessDashboard);
router.get("/dashboard/activities", DashboardController.getRecentActivities);
router.get("/dashboard/actions", DashboardController.getQuickActions);

// ========== NOTIFICATION ROUTES ==========
router.get("/notifications", NotificationController.getNotifications);
router.get(
  "/notifications/unread",
  NotificationController.getUnreadNotifications
);
router.get("/notifications/count", NotificationController.getUnreadCount);
router.post("/notifications", NotificationController.createNotification);
router.put("/notifications/:id/read", NotificationController.markAsRead);
router.put("/notifications/read-all", NotificationController.markAllAsRead);
router.delete("/notifications/:id", NotificationController.deleteNotification);

// ========== MESSAGE ROUTES ==========
router.get("/messages", MessageController.getMessages);
router.get("/messages/unread", MessageController.getUnreadMessages);
router.get("/messages/urgent", MessageController.getUrgentMessages);
router.get("/messages/count", MessageController.getUnreadCount);
router.post("/messages", MessageController.createMessage);
router.put("/messages/:id/read", MessageController.markAsRead);
router.delete("/messages/:id", MessageController.deleteMessage);

// ========== HEALTH CHECK ==========
router.get("/health", (req: any, res: any) => {
  res.json({
    success: true,
    message: "Analytics API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
