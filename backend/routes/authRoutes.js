const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to generate standard 7-day JWT token
 */
function generateToken(user) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured in environment variables.");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Full name is required."
      });
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password is required and must be at least 6 characters long."
      });
    }

    const trimmedName = name.trim();

    // Check if email already exists
    const existingUserQuery = "SELECT id FROM users WHERE email = $1;";
    const existingUserResult = await pool.query(existingUserQuery, [trimmedEmail]);

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists."
      });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const insertQuery = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at;
    `;
    const insertResult = await pool.query(insertQuery, [trimmedName, trimmedEmail, passwordHash]);
    const newUser = insertResult.rows[0];

    // Generate JWT token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to register user. Please try again."
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user and return JWT
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Query user by email
    const query = "SELECT id, name, email, password_hash FROM users WHERE email = $1;";
    const result = await pool.query(query, [trimmedEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    // Verify password with bcryptjs
    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to log in. Please try again."
    });
  }
});

/**
 * GET /api/auth/me
 * Fetch authenticated user details
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = "SELECT id, name, email, created_at FROM users WHERE id = $1;";
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    const user = result.rows[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error("Get user profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile."
    });
  }
});

module.exports = router;
