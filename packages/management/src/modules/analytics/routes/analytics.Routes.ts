// src/modules/analytics/routes/analytics.Routes.ts
import { Router } from "express";
import DashboardController from "../controllers/DashboardController";
import NotificationController from "../controllers/NotificationController";
import MessageController from "../controllers/MessageController";

const router = Router();

// ========== DASHBOARD ROUTES ==========
// GET /analytics/dashboard - Complete dashboard data
router.get("/dashboard", DashboardController.getDashboardData);

// GET /analytics/dashboard/metrics - Just metrics
router.get("/dashboard/metrics", DashboardController.getDashboardMetrics);

// GET /analytics/dashboard/business - Business data
router.get("/dashboard/business", DashboardController.getBusinessDashboard);

// GET /analytics/dashboard/activities - Recent activities
router.get("/dashboard/activities", DashboardController.getRecentActivities);

// GET /analytics/dashboard/actions - Quick actions
router.get("/dashboard/actions", DashboardController.getQuickActions);

// ========== NOTIFICATION ROUTES ==========
// GET /analytics/notifications - All notifications
router.get("/notifications", NotificationController.getNotifications);

// GET /analytics/notifications/unread - Unread notifications
router.get(
  "/notifications/unread",
  NotificationController.getUnreadNotifications
);

// GET /analytics/notifications/count - Unread count
router.get("/notifications/count", NotificationController.getUnreadCount);

// POST /analytics/notifications - Create notification
router.post("/notifications", NotificationController.createNotification);

// PUT /analytics/notifications/:id/read - Mark as read
router.put("/notifications/:id/read", NotificationController.markAsRead);

// PUT /analytics/notifications/read-all - Mark all as read
router.put("/notifications/read-all", NotificationController.markAllAsRead);

// DELETE /analytics/notifications/:id - Delete notification
router.delete("/notifications/:id", NotificationController.deleteNotification);

// ========== MESSAGE ROUTES ==========
// GET /analytics/messages - All messages
router.get("/messages", MessageController.getMessages);

// GET /analytics/messages/unread - Unread messages
router.get("/messages/unread", MessageController.getUnreadMessages);

// GET /analytics/messages/urgent - Urgent messages
router.get("/messages/urgent", MessageController.getUrgentMessages);

// GET /analytics/messages/count - Unread count
router.get("/messages/count", MessageController.getUnreadCount);

// POST /analytics/messages - Create message
router.post("/messages", MessageController.createMessage);

// PUT /analytics/messages/:id/read - Mark as read
router.put("/messages/:id/read", MessageController.markAsRead);

// DELETE /analytics/messages/:id - Delete message
router.delete("/messages/:id", MessageController.deleteMessage);

// ========== HEALTH CHECK ==========
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Analytics API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
