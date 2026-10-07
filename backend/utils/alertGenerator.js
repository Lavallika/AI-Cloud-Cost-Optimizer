const pool = require("../config/db");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

// Legacy constant kept for external callers that import it; no longer used
// internally for threshold decisions (superseded by per-user preferences).
const HIGH_COST_THRESHOLD = 10000;

/**
 * Format numeric amount into INR currency string (e.g. ₹15,000).
 */
function formatINR(amount) {
  const num = Math.round(Number(amount) || 0);
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Build resource identifier text for notification messages.
 */
function getResourceText(costRecord) {
  if (costRecord.resource_name && String(costRecord.resource_name).trim()) {
    return `resource ${String(costRecord.resource_name).trim()}`;
  }
  return `resource`;
}

/**
 * Fetch the authenticated user's notification preferences from
 * user_notification_preferences using a parameterized query.
 *
 * If no row exists for this user, returns the PostgreSQL column defaults so
 * that alert generation behaves identically to the preference API's GET
 * auto-create path (all enabled = true, threshold = 10000).
 *
 * @param {number|string} userId
 * @returns {Promise<{
 *   high_cost_enabled: boolean,
 *   cost_increase_enabled: boolean,
 *   low_utilization_enabled: boolean,
 *   ai_recommendation_enabled: boolean,
 *   optimization_opportunity_enabled: boolean,
 *   high_cost_threshold: number
 * }>}
 */
async function getUserNotificationPreferences(userId) {
  try {
    const result = await pool.query(
      `SELECT
         high_cost_enabled,
         cost_increase_enabled,
         low_utilization_enabled,
         ai_recommendation_enabled,
         optimization_opportunity_enabled,
         high_cost_threshold
       FROM user_notification_preferences
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        high_cost_enabled: Boolean(row.high_cost_enabled),
        cost_increase_enabled: Boolean(row.cost_increase_enabled),
        low_utilization_enabled: Boolean(row.low_utilization_enabled),
        ai_recommendation_enabled: Boolean(row.ai_recommendation_enabled),
        optimization_opportunity_enabled: Boolean(row.optimization_opportunity_enabled),
        high_cost_threshold: parseFloat(row.high_cost_threshold) || HIGH_COST_THRESHOLD
      };
    }
  } catch (err) {
    console.error(`Failed to fetch notification preferences for user ${userId}:`, err.message);
  }

  // Fall back to database column defaults — all alerts enabled, threshold 10000
  return {
    high_cost_enabled: true,
    cost_increase_enabled: true,
    low_utilization_enabled: true,
    ai_recommendation_enabled: true,
    optimization_opportunity_enabled: true,
    high_cost_threshold: HIGH_COST_THRESHOLD
  };
}

/**
 * Insert a notification into the PostgreSQL notifications table if
 * a duplicate alert (same user_id, type, source_id) does not already
 * exist within the last 24 hours.
 */
async function insertAlertIfNotDuplicate({
  userId,
  type,
  severity,
  title,
  message,
  sourceId,
  sourceType = "cloud_cost"
}) {
  try {
    const checkQuery = `
      SELECT id
      FROM notifications
      WHERE user_id = $1
        AND type = $2
        AND source_id = $3
        AND created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 1;
    `;
    const checkResult = await pool.query(checkQuery, [userId, type, sourceId]);

    if (checkResult.rows.length > 0) {
      console.log(`Skipped duplicate ${type} alert for cost record ${sourceId}`);
      return null;
    }

    const insertQuery = `
      INSERT INTO notifications (
        user_id,
        type,
        severity,
        title,
        message,
        is_read,
        source_id,
        source_type
      )
      VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)
      RETURNING id, type, severity, title, message, is_read, source_id, source_type, created_at;
    `;
    const insertResult = await pool.query(insertQuery, [
      userId,
      type,
      severity,
      title,
      message,
      sourceId,
      sourceType
    ]);

    console.log(`Generated ${type} alert for cost record ${sourceId}`);
    return insertResult.rows[0];
  } catch (err) {
    console.error(`Failed to insert ${type} alert for cost record ${sourceId}:`, err.message);
    return null;
  }
}

/**
 * Call the existing ML optimization engine with timeout and error handling.
 * Returns recommendation details and potential monthly savings, or null if unavailable.
 */
async function fetchMLOptimization(costRecord) {
  const hasCpu = costRecord.cpu_utilization !== null && costRecord.cpu_utilization !== undefined && costRecord.cpu_utilization !== "";
  const hasMem = costRecord.memory_utilization !== null && costRecord.memory_utilization !== undefined && costRecord.memory_utilization !== "";
  const hasStorage = costRecord.storage_utilization !== null && costRecord.storage_utilization !== undefined && costRecord.storage_utilization !== "";

  // Only call ML optimization if at least one utilization metric is present
  if (!hasCpu && !hasMem && !hasStorage) {
    return null;
  }

  const currentCost = parseFloat(costRecord.current_monthly_cost || 0);
  const cpu = hasCpu ? parseFloat(costRecord.cpu_utilization) : 0;
  const mem = hasMem ? parseFloat(costRecord.memory_utilization) : 0;
  const storage = hasStorage ? parseFloat(costRecord.storage_utilization) : 0;
  const usage = costRecord.usage_hours !== null && costRecord.usage_hours !== undefined && costRecord.usage_hours !== ""
    ? parseFloat(costRecord.usage_hours)
    : 720;
  const requests = costRecord.request_count !== null && costRecord.request_count !== undefined && costRecord.request_count !== ""
    ? parseFloat(costRecord.request_count)
    : 1000;
  const transfer = costRecord.data_transfer_gb !== null && costRecord.data_transfer_gb !== undefined && costRecord.data_transfer_gb !== ""
    ? parseFloat(costRecord.data_transfer_gb)
    : 0;

  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

  const mlPayload = {
    provider: costRecord.provider || "AWS",
    service: costRecord.service || "EC2",
    region: costRecord.region || "Mumbai",
    cpu_utilization: cpu,
    memory_utilization: mem,
    storage_utilization: storage,
    usage_hours: usage,
    request_count: requests,
    data_transfer_gb: transfer
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const mlRes = await fetch(`${mlServiceUrl}/api/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (mlRes.ok) {
      const mlData = await mlRes.json();
      if (mlData.success && Array.isArray(mlData.recommendations) && mlData.recommendations.length > 0) {
        const topRec = mlData.recommendations[0];
        const predictedCost = mlData.predicted_monthly_cost || currentCost;

        let savings = 0;
        if (topRec.estimated_savings && predictedCost > 0) {
          const ratio = topRec.estimated_savings / predictedCost;
          savings = Math.round(currentCost * Math.min(ratio, 0.45));
        } else if (topRec.estimated_savings) {
          savings = Math.min(Math.round(topRec.estimated_savings), Math.round(currentCost * 0.4));
        } else if (mlData.total_estimated_savings) {
          savings = Math.min(Math.round(mlData.total_estimated_savings), Math.round(currentCost * 0.4));
        }

        if (savings <= 0 && currentCost > 0) {
          savings = Math.round(currentCost * 0.15);
        }

        return {
          recommendations: mlData.recommendations,
          topRecommendation: topRec,
          potentialSavings: savings
        };
      }
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`AI optimization unavailable for cost record ${costRecord.id}: ${err.message}`);
    return null;
  }
}

/**
 * Generate relevant notifications for a newly created cloud cost record.
 *
 * Respects the authenticated user's notification preferences stored in
 * user_notification_preferences. Each alert type is gated behind its
 * corresponding enabled flag, and HIGH_COST uses the user's personal
 * high_cost_threshold rather than the legacy hardcoded constant.
 *
 * All existing behaviour is preserved:
 *   - 24-hour deduplication per (user_id, type, source_id)
 *   - Complete user isolation (every query scoped to userId)
 *   - Parameterized SQL throughout
 *   - ML service timeout / fail-safe
 *   - Cost-record creation is never failed by alert errors
 *   - Identical notification messages, source_id, source_type
 *
 * @param {Object} costRecord - The newly created row from cloud_costs table
 * @param {number|string} userId - Authenticated user ID (req.user.id)
 */
async function generateAlertsForCostRecord(costRecord, userId) {
  if (!costRecord || !costRecord.id || !userId) {
    return;
  }

  try {
    const currentCost = parseFloat(costRecord.current_monthly_cost || 0);
    const provider = costRecord.provider || "Cloud";
    const service = costRecord.service || "Service";
    const resText = getResourceText(costRecord);

    // ─── Load user's notification preferences ────────────────────────────────
    // Falls back to all-enabled defaults if the user has no preference row yet.
    const prefs = await getUserNotificationPreferences(userId);

    // ─── 1. HIGH_COST ALERT ──────────────────────────────────────────────────
    // Gated by high_cost_enabled; uses the user's personal high_cost_threshold.
    if (prefs.high_cost_enabled && currentCost >= prefs.high_cost_threshold) {
      const formattedCost = formatINR(currentCost);
      const formattedThreshold = formatINR(prefs.high_cost_threshold);
      const title = "High Cloud Cost Detected";
      const message = `Your ${provider} ${service} ${resText} has a monthly cost of ${formattedCost}, which exceeds the high-cost alert threshold of ${formattedThreshold}.`;

      await insertAlertIfNotDuplicate({
        userId,
        type: "HIGH_COST",
        severity: "critical",
        title,
        message,
        sourceId: costRecord.id,
        sourceType: "cloud_cost"
      });
    }

    // ─── 2. COST_INCREASE ALERT ──────────────────────────────────────────────
    // Gated by cost_increase_enabled.
    if (prefs.cost_increase_enabled) {
      if (costRecord.previous_monthly_cost !== null && costRecord.previous_monthly_cost !== undefined && costRecord.previous_monthly_cost !== "") {
        const prevCost = parseFloat(costRecord.previous_monthly_cost);
        if (!isNaN(prevCost) && prevCost > 0) {
          const diff = currentCost - prevCost;
          if (diff > 0) {
            const pctIncrease = (diff / prevCost) * 100;
            if (pctIncrease >= 10) {
              const formattedPrev = formatINR(prevCost);
              const formattedCurrent = formatINR(currentCost);
              const pctText = `${pctIncrease.toFixed(1)}%`;
              const title = "Cloud Cost Increased";
              const message = `Your ${provider} ${service} ${resText} cost increased from ${formattedPrev} to ${formattedCurrent}, a ${pctText} increase.`;

              await insertAlertIfNotDuplicate({
                userId,
                type: "COST_INCREASE",
                severity: "warning",
                title,
                message,
                sourceId: costRecord.id,
                sourceType: "cloud_cost"
              });
            }
          }
        }
      }
    }

    // ─── 3. LOW_UTILIZATION ALERT ────────────────────────────────────────────
    // Gated by low_utilization_enabled.
    if (prefs.low_utilization_enabled) {
      const lowMetrics = [];
      if (costRecord.cpu_utilization !== null && costRecord.cpu_utilization !== undefined && costRecord.cpu_utilization !== "") {
        const cpu = parseFloat(costRecord.cpu_utilization);
        if (!isNaN(cpu) && cpu < 30) {
          lowMetrics.push(`CPU: ${cpu.toFixed(1)}%`);
        }
      }
      if (costRecord.memory_utilization !== null && costRecord.memory_utilization !== undefined && costRecord.memory_utilization !== "") {
        const mem = parseFloat(costRecord.memory_utilization);
        if (!isNaN(mem) && mem < 30) {
          lowMetrics.push(`Memory: ${mem.toFixed(1)}%`);
        }
      }
      if (costRecord.storage_utilization !== null && costRecord.storage_utilization !== undefined && costRecord.storage_utilization !== "") {
        const storage = parseFloat(costRecord.storage_utilization);
        if (!isNaN(storage) && storage < 30) {
          lowMetrics.push(`Storage: ${storage.toFixed(1)}%`);
        }
      }

      if (lowMetrics.length > 0) {
        const title = "Low Resource Utilization";
        const message = `Your ${provider} ${service} ${resText} reported low utilization (${lowMetrics.join(", ")}). This resource appears to be underutilized and may be suitable for rightsizing or scheduling review.`;

        await insertAlertIfNotDuplicate({
          userId,
          type: "LOW_UTILIZATION",
          severity: "warning",
          title,
          message,
          sourceId: costRecord.id,
          sourceType: "cloud_cost"
        });
      }
    }

    // ─── 4 & 5. AI_RECOMMENDATION & OPTIMIZATION_OPPORTUNITY ALERTS ──────────
    // Both gated individually: ai_recommendation_enabled and
    // optimization_opportunity_enabled. The ML fetch is skipped entirely if
    // both flags are disabled, saving the network round-trip.
    if (prefs.ai_recommendation_enabled || prefs.optimization_opportunity_enabled) {
      let optResult = null;
      try {
        optResult = await fetchMLOptimization(costRecord);
      } catch (optErr) {
        console.warn(`AI optimization unavailable for cost record ${costRecord.id}: ${optErr.message}`);
      }

      if (optResult && optResult.topRecommendation) {
        // 4. AI_RECOMMENDATION alert — gated by ai_recommendation_enabled
        if (prefs.ai_recommendation_enabled) {
          const topRec = optResult.topRecommendation;
          const savingsNote = optResult.potentialSavings > 0
            ? ` Estimated potential monthly savings: ${formatINR(optResult.potentialSavings)}.`
            : "";
          const aiTitle = "AI Optimization Recommendation";
          const aiMessage = `AI analysis identified an optimization opportunity for this ${provider} ${service} ${resText}. Recommendation: ${topRec.title}.${savingsNote}`;

          await insertAlertIfNotDuplicate({
            userId,
            type: "AI_RECOMMENDATION",
            severity: "info",
            title: aiTitle,
            message: aiMessage,
            sourceId: costRecord.id,
            sourceType: "cloud_cost"
          });
        }

        // 5. OPTIMIZATION_OPPORTUNITY alert — gated by optimization_opportunity_enabled
        if (prefs.optimization_opportunity_enabled && optResult.potentialSavings > 0) {
          const topRec = optResult.topRecommendation;
          const optTitle = "Optimization Opportunity Available";
          const optMessage = `Optimization opportunity available for ${provider} ${service} ${resText} with estimated potential monthly savings of ${formatINR(optResult.potentialSavings)}. Summary: ${topRec.title}.`;

          await insertAlertIfNotDuplicate({
            userId,
            type: "OPTIMIZATION_OPPORTUNITY",
            severity: "info",
            title: optTitle,
            message: optMessage,
            sourceId: costRecord.id,
            sourceType: "cloud_cost"
          });
        }
      }
    }
  } catch (error) {
    console.error(`Alert generation failed for cost record ${costRecord?.id}:`, error.message);
  }
}

module.exports = {
  generateAlertsForCostRecord,
  insertAlertIfNotDuplicate,
  getUserNotificationPreferences,
  HIGH_COST_THRESHOLD
};
