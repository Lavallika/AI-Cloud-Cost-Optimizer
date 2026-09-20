import { getAuthHeaders } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Handle API responses with standardized error extraction
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to parse server response. Please try again.");
  }

  if (!response.ok) {
    const error = new Error(data?.message || "An unexpected error occurred with notifications.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch notifications for the authenticated user
 * @param {number} [limit=20] Max notifications to return (1-50)
 * @returns {Promise<{ notifications: Array, unreadCount: number }>}
 */
export async function fetchNotifications(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const response = await fetch(`${API_URL}/api/notifications?limit=${safeLimit}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Fetch unread notification count for the authenticated user
 * @returns {Promise<{ unreadCount: number }>}
 */
export async function fetchUnreadCount() {
  const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Mark a single notification as read
 * @param {number|string} id Notification ID
 * @returns {Promise<{ message: string, notification: Object }>}
 */
export async function markNotificationAsRead(id) {
  const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Mark all unread notifications as read for the authenticated user
 * @returns {Promise<{ message: string }>}
 */
export async function markAllNotificationsAsRead() {
  const response = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Delete a notification for the authenticated user
 * @param {number|string} id Notification ID
 * @returns {Promise<{ message: string }>}
 */
export async function deleteNotification(id) {
  const response = await fetch(`${API_URL}/api/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}
