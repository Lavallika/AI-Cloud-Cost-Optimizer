const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse and validate a positive integer notification ID from req.params.id.
 * Returns the integer, or null if invalid.
 */
function parseNotificationId(rawId) {
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0 || String(id) !== String(rawId)) return null;
  return id;
}

/**
 * Parse the `limit` query parameter safely.
 * Default: 20. Min: 1. Max: 50.
 */
function parseLimit(rawLimit) {
  const parsed = parseInt(rawLimit, 10);
  if (isNaN(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 50);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/notifications
 * Returns the authenticated user's notifications, newest first.
 * Optional query param: ?limit=20 (default 20, max 50)
 *
 * Response:
 *   { notifications: [...], unreadCount: N }
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseLimit(req.query.limit);

    // Fetch paginated notifications for this user only
    const notificationsResult = await pool.query(
      `SELECT
         id,
         type,
         severity,
         title,
         message,
         is_read,
         source_id,
         source_type,
         created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    // Count unread notifications for this user only
    const unreadResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      notifications: notificationsResult.rows,
      unreadCount: parseInt(unreadResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns only the authenticated user's unread notification count.
 *
 * NOTE: This literal route is declared BEFORE /:id routes so Express does not
 * treat the string "unread-count" as a notification ID parameter.
 *
 * Response:
 *   { unreadCount: N }
 */
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      unreadCount: parseInt(result.rows[0].count, 10),
    });
  } catch (error) {
    console.error("Error fetching unread count:", error.message);
    return res.status(500).json({ message: "Failed to fetch unread notification count" });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks ALL unread notifications belonging to req.user.id as read.
 *
 * NOTE: This literal route is declared BEFORE /:id/read so Express does not
 * treat the string "read-all" as a notification ID parameter.
 *
 * Response:
 *   { message: "All notifications marked as read" }
 */
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error.message);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read — only if it belongs to req.user.id.
 *
 * SQL enforces: WHERE id = $1 AND user_id = $2
 *
 * Response:
 *   { message: "Notification marked as read", notification: {...} }
 *
 * 400 — invalid :id (not a positive integer)
 * 404 — not found or belongs to a different user (no info leakage)
 */
router.patch("/:id/read", authMiddleware, async (req, res) => {
  const notificationId = parseNotificationId(req.params.id);

  if (notificationId === null) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, type, severity, title, message, is_read, source_id, source_type, created_at`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error.message);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

/**
 * DELETE /api/notifications/:id
 * Deletes a single notification — only if it belongs to req.user.id.
 *
 * SQL enforces: WHERE id = $1 AND user_id = $2
 *
 * Response:
 *   { message: "Notification deleted" }
 *
 * 400 — invalid :id
 * 404 — not found or belongs to a different user (no info leakage)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  const notificationId = parseNotificationId(req.params.id);

  if (notificationId === null) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error.message);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;
