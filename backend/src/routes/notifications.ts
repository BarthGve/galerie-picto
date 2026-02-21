import { Router, Response } from "express";
import { authAnyUser } from "../middleware/auth-any-user.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
} from "../db/repositories/notifications.js";

const router = Router();

// GET /api/notifications - List user's notifications (non-dismissed only)
router.get(
  "/",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      const notifs = getNotifications(login);
      res.json({ notifications: notifs });
    } catch {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  },
);

// GET /api/notifications/unread-count - Get unread count (for badge)
router.get(
  "/unread-count",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      const count = getUnreadCount(login);
      res.json({ count });
    } catch {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  },
);

// PATCH /api/notifications/:id/read - Mark one notification as read
router.patch(
  "/:id/read",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const login = req.user!.login;

    try {
      const success = markAsRead(id, login);
      if (!success) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch(
  "/read-all",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      const count = markAllAsRead(login);
      res.json({ success: true, marked: count });
    } catch {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  },
);

// DELETE /api/notifications/:id - Dismiss one notification
router.delete(
  "/:id",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    const id = String(req.params.id);
    const login = req.user!.login;

    try {
      const success = dismissNotification(id, login);
      if (!success) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }
      res.status(204).end();
    } catch {
      res.status(500).json({ error: "Failed to dismiss notification" });
    }
  },
);

// DELETE /api/notifications - Dismiss all notifications
router.delete(
  "/",
  authAnyUser,
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      const login = req.user!.login;
      dismissAllNotifications(login);
      res.status(204).end();
    } catch {
      res.status(500).json({ error: "Failed to dismiss all notifications" });
    }
  },
);

export default router;
