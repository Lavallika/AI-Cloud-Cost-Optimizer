import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchNotifications as apiFetchNotifications,
  fetchUnreadCount as apiFetchUnreadCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from "../services/notificationApi";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep a ref to unreadCount and notifications for rollback in case of API failure
  const notificationsRef = useRef([]);
  notificationsRef.current = notifications;

  /**
   * Fetch full list of notifications and unread count from backend
   */
  const refreshNotifications = useCallback(async (limit = 20) => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiFetchNotifications(limit);
      setNotifications(data.notifications || []);
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Lightweight polling function to fetch ONLY the unread count
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const data = await apiFetchUnreadCount();
      if (typeof data?.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Non-blocking failure for polling
      console.warn("Polling unread count failed:", err.message);
    }
  }, [isAuthenticated, user]);

  /**
   * Mark a single notification as read (with optimistic UI update)
   */
  const markAsRead = useCallback(async (id) => {
    const target = notificationsRef.current.find((n) => n.id === id);
    if (!target || target.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await apiMarkAsRead(id);
      if (res?.notification) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? res.notification : n))
        );
      }
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err.message);
      // Revert optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  /**
   * Mark all notifications as read (with optimistic UI update)
   */
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notificationsRef.current;
    const previousUnread = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await apiMarkAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err.message);
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
    }
  }, [unreadCount]);

  /**
   * Delete a notification (with optimistic UI update)
   */
  const deleteNotification = useCallback(async (id) => {
    const target = notificationsRef.current.find((n) => n.id === id);
    if (!target) return;

    const wasUnread = !target.is_read;
    const previousNotifications = notificationsRef.current;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiDeleteNotification(id);
    } catch (err) {
      console.error(`Failed to delete notification ${id}:`, err.message);
      // Revert on error
      setNotifications(previousNotifications);
      if (wasUnread) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, []);

  // Initial load and session lifecycle management
  useEffect(() => {
    let intervalId = null;

    if (isAuthenticated && user) {
      // Initial fetch of notifications & unread count
      refreshNotifications();

      // Lightweight polling of unread count every 30 seconds
      intervalId = setInterval(() => {
        refreshUnreadCount();
      }, 30000);
    } else {
      // User logged out or unauthenticated: clean up state immediately
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, user, refreshNotifications, refreshUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;
