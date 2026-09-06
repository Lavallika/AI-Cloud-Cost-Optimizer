const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Return authorization header helper
 * @param {string} [customToken] Optional token, otherwise retrieves from localStorage
 */
export function getAuthHeaders(customToken) {
  const token = customToken || localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Helper to parse response and extract error messages
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to parse server response. Please try again.");
  }

  if (!response.ok) {
    let errorMessage = data?.message || "An unexpected error occurred.";
    if (response.status === 400) {
      errorMessage = data?.message || "Please check your input details and try again.";
    } else if (response.status === 401) {
      errorMessage = data?.message || "Invalid email or password.";
    } else if (response.status === 404) {
      errorMessage = data?.message || "User profile not found.";
    } else if (response.status === 409) {
      errorMessage = data?.message || "An account with this email address already exists.";
    } else if (response.status >= 500) {
      errorMessage = data?.message || "Internal server error. Please try again later.";
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Register a new user account
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
export async function registerUser(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the server. Please check your backend connection.");
    }
    throw error;
  }
}

/**
 * Authenticate existing user and return JWT
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the server. Please check your backend connection.");
    }
    throw error;
  }
}

/**
 * Fetch authenticated user profile using JWT token
 * @param {string} token
 */
export async function getCurrentUser(token) {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the server. Please check your backend connection.");
    }
    throw error;
  }
}
