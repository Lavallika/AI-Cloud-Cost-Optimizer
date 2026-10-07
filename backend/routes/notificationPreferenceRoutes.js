const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ─── Constants & Whitelists ──────────────────────────────────────────────────

const ALLOWED_FIELDS = [
  "high_cost_enabled",
  "cost_increase_enabled",
  "low_utilization_enabled",
  "ai_recommendation_enabled",
  "optimization_opportunity_enabled",
  "high_cost_threshold"
];

const BOOLEAN_FIELDS = [
  "high_cost_enabled",
  "cost_increase_enabled",
  "low_utilization_enabled",
  "ai_recommendation_enabled",
  "optimization_opportunity_enabled"
];

const MAX_HIGH_COST_THRESHOLD = 10000000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format database preference row into safe and clean API response object
 */
function formatPreferences(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    high_cost_enabled: Boolean(row.high_cost_enabled),
    cost_increase_enabled: Boolean(row.cost_increase_enabled),
    low_utilization_enabled: Boolean(row.low_utilization_enabled),
    ai_recommendation_enabled: Boolean(row.ai_recommendation_enabled),
    optimization_opportunity_enabled: Boolean(row.optimization_opportunity_enabled),
    high_cost_threshold: parseFloat(row.high_cost_threshold),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/notification-preferences
 * Returns the authenticated user's notification preferences.
 * If no preference row exists, creates one using database defaults.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if preference row already exists for this user
    let result = await pool.query(
      `SELECT
         id,
         user_id,
         high_cost_enabled,
         cost_increase_enabled,
         low_utilization_enabled,
         ai_recommendation_enabled,
         optimization_opportunity_enabled,
         high_cost_threshold,
         created_at,
         updated_at
       FROM user_notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    // If no preference record exists yet, create one using database defaults
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO user_notification_preferences (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING
           id,
           user_id,
           high_cost_enabled,
           cost_increase_enabled,
           low_utilization_enabled,
           ai_recommendation_enabled,
           optimization_opportunity_enabled,
           high_cost_threshold,
           created_at,
           updated_at`,
        [userId]
      );
    }

    const preferences = formatPreferences(result.rows[0]);

    return res.status(200).json({
      success: true,
      preferences,
      data: preferences
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification preferences"
    });
  }
});

/**
 * PUT /api/notification-preferences
 * Updates the authenticated user's notification preferences.
 * Validates boolean fields strictly and ensures high_cost_threshold is positive (<= 10,000,000).
 * Arbitrary columns are rejected.
 */
router.put("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object."
      });
    }

    const keys = Object.keys(req.body);
    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty. Please provide at least one preference field to update."
      });
    }

    // Disallow arbitrary columns
    const invalidKeys = keys.filter((key) => !ALLOWED_FIELDS.includes(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid field(s) detected: ${invalidKeys.join(", ")}. Arbitrary columns are not allowed.`
      });
    }

    // Validate booleans strictly
    for (const field of BOOLEAN_FIELDS) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "boolean") {
          return res.status(400).json({
            success: false,
            message: `${field} must be a boolean (true or false).`
          });
        }
      }
    }

    // Validate high_cost_threshold as a positive number (up to 10,000,000)
    if (req.body.high_cost_threshold !== undefined) {
      const rawVal = req.body.high_cost_threshold;
      const numVal =
        typeof rawVal === "number"
          ? rawVal
          : typeof rawVal === "string" && rawVal.trim() !== ""
          ? Number(rawVal)
          : NaN;

      if (
        typeof numVal !== "number" ||
        isNaN(numVal) ||
        !isFinite(numVal) ||
        numVal <= 0 ||
        numVal > MAX_HIGH_COST_THRESHOLD
      ) {
        return res.status(400).json({
          success: false,
          message: `high_cost_threshold must be a positive number greater than 0 and up to ${MAX_HIGH_COST_THRESHOLD.toLocaleString()}.`
        });
      }
    }

    // Ensure the user's preference row exists before updating
    await pool.query(
      `INSERT INTO user_notification_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Build parameterized UPDATE query
    const setClauses = [];
    const values = [userId];
    let paramIndex = 2;

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        const val =
          field === "high_cost_threshold"
            ? Number(req.body[field])
            : req.body[field];
        values.push(val);
        paramIndex++;
      }
    }

    setClauses.push("updated_at = NOW()");

    const updateQuery = `
      UPDATE user_notification_preferences
      SET ${setClauses.join(", ")}
      WHERE user_id = $1
      RETURNING
        id,
        user_id,
        high_cost_enabled,
        cost_increase_enabled,
        low_utilization_enabled,
        ai_recommendation_enabled,
        optimization_opportunity_enabled,
        high_cost_threshold,
        created_at,
        updated_at;
    `;

    const result = await pool.query(updateQuery, values);
    const updatedPreferences = formatPreferences(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: updatedPreferences,
      data: updatedPreferences
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification preferences"
    });
  }
});

/**
 * POST /api/notification-preferences/reset
 * Resets the authenticated user's notification preferences to database defaults.
 * Scoped strictly to req.user.id.
 */
router.post("/reset", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const resetQuery = `
      INSERT INTO user_notification_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET
        high_cost_enabled = DEFAULT,
        cost_increase_enabled = DEFAULT,
        low_utilization_enabled = DEFAULT,
        ai_recommendation_enabled = DEFAULT,
        optimization_opportunity_enabled = DEFAULT,
        high_cost_threshold = DEFAULT,
        updated_at = NOW()
      RETURNING
        id,
        user_id,
        high_cost_enabled,
        cost_increase_enabled,
        low_utilization_enabled,
        ai_recommendation_enabled,
        optimization_opportunity_enabled,
        high_cost_threshold,
        created_at,
        updated_at;
    `;

    const result = await pool.query(resetQuery, [userId]);
    const resetPreferences = formatPreferences(result.rows[0]);

    return res.status(200).json({
      success: true,
      message: "Notification preferences reset to defaults successfully",
      preferences: resetPreferences,
      data: resetPreferences
    });
  } catch (error) {
    console.error("Error resetting notification preferences:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset notification preferences"
    });
  }
});

module.exports = router;
