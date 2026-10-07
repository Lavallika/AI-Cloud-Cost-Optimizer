import { getAuthHeaders } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Helper to handle response and extract meaningful error messages
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to parse server response. Please try again.");
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "An unexpected error occurred with notification preferences."
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch notification preferences for the authenticated user
 * GET /api/notification-preferences
 * @returns {Promise<{ success: boolean, preferences: Object, data: Object }>}
 */
export async function fetchNotificationPreferences() {
  const response = await fetch(`${API_URL}/api/notification-preferences`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Update notification preferences for the authenticated user
 * PUT /api/notification-preferences
 * @param {Object} preferences - Fields to update (booleans and/or high_cost_threshold)
 * @returns {Promise<{ success: boolean, message: string, preferences: Object, data: Object }>}
 */
export async function updateNotificationPreferences(preferences) {
  const response = await fetch(`${API_URL}/api/notification-preferences`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(preferences),
  });
  return handleResponse(response);
}

/**
 * Reset notification preferences to defaults for the authenticated user
 * POST /api/notification-preferences/reset
 * @returns {Promise<{ success: boolean, message: string, preferences: Object, data: Object }>}
 */
export async function resetNotificationPreferences() {
  const response = await fetch(`${API_URL}/api/notification-preferences/reset`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}
