import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getCurrentUser } from "../services/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentUser(storedToken);
        if (isMounted) {
          if (response?.success && response?.user) {
            setUser(response.user);
            setToken(storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          } else {
            // Token invalid or unverified
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.warn("Auth token validation failed:", error.message);
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with email & password
   */
  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password);
    if (data?.token && data?.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Register new user account
   */
  const register = useCallback(async (name, email, password) => {
    const data = await registerUser(name, email, password);
    if (data?.token && data?.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Log out current user
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
