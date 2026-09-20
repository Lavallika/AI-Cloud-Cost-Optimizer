const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * POST /api/costs
 * Create a new cloud cost record in PostgreSQL.
 * user_id is taken from req.user.id (JWT) — never from the request body.
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      provider,
      service,
      region,
      resource_name,
      resource,
      usage_hours,
      usage,
      current_monthly_cost,
      currentCost,
      previous_monthly_cost,
      previousCost,
      cpu_utilization,
      memory_utilization,
      storage_utilization,
      request_count,
      data_transfer_gb,
      billing_date,
      billingDate
    } = req.body;

    // user_id always comes from the verified JWT — never trust the request body
    const userId = req.user.id;

    const finalProvider = provider;
    const finalService = service;
    const finalRegion = region;
    const finalResourceName = resource_name || resource || null;

    let rawUsageHours = usage_hours !== undefined ? usage_hours : usage;
    let finalUsageHours = null;
    if (rawUsageHours !== null && rawUsageHours !== undefined && rawUsageHours !== "") {
      const parsedUsage = parseFloat(rawUsageHours);
      if (!isNaN(parsedUsage)) finalUsageHours = parsedUsage;
    }

    const rawCurrentCost = current_monthly_cost !== undefined ? current_monthly_cost : currentCost;
    const rawPreviousCost = previous_monthly_cost !== undefined ? previous_monthly_cost : previousCost;

    // Validate required fields
    if (!finalProvider || !finalService || !finalRegion || rawCurrentCost === undefined || rawCurrentCost === null || rawCurrentCost === "") {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: provider, service, region, and current_monthly_cost are required."
      });
    }

    const finalCurrentCost = parseFloat(rawCurrentCost);
    let finalPreviousCost = null;
    if (rawPreviousCost !== undefined && rawPreviousCost !== null && rawPreviousCost !== "") {
      const parsedPrev = parseFloat(rawPreviousCost);
      if (!isNaN(parsedPrev)) finalPreviousCost = parsedPrev;
    }

    const finalCpu = cpu_utilization ? parseFloat(cpu_utilization) : null;
    const finalMemory = memory_utilization ? parseFloat(memory_utilization) : null;
    const finalStorage = storage_utilization ? parseFloat(storage_utilization) : null;
    const finalRequests = request_count ? parseInt(request_count, 10) : null;
    const finalDataTransfer = data_transfer_gb ? parseFloat(data_transfer_gb) : null;
    const finalBillingDate = billing_date || billingDate || null;

    const query = `
      INSERT INTO cloud_costs (
        user_id,
        provider,
        service,
        region,
        resource_name,
        usage_hours,
        current_monthly_cost,
        previous_monthly_cost,
        cpu_utilization,
        memory_utilization,
        storage_utilization,
        request_count,
        data_transfer_gb,
        billing_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      userId,
      finalProvider,
      finalService,
      finalRegion,
      finalResourceName,
      finalUsageHours,
      finalCurrentCost,
      finalPreviousCost,
      finalCpu,
      finalMemory,
      finalStorage,
      finalRequests,
      finalDataTransfer,
      finalBillingDate
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Cost record created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating cost record:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create cost record",
      error: error.message
    });
  }
});

/**
 * GET /api/costs
 * Fetch all cost records belonging to the authenticated user only.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = "SELECT * FROM cloud_costs WHERE user_id = $1 ORDER BY created_at DESC;";
    const result = await pool.query(query, [userId]);

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching cost records:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cost records",
      error: error.message
    });
  }
});

/**
 * GET /api/costs/:id
 * Fetch a single cost record by ID, only if it belongs to the authenticated user.
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Both id AND user_id must match — prevents IDOR
    const query = "SELECT * FROM cloud_costs WHERE id = $1 AND user_id = $2;";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cost record not found"
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Error fetching cost record with ID ${req.params.id}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cost record",
      error: error.message
    });
  }
});

/**
 * DELETE /api/costs/:id
 * Delete a cost record only if it belongs to the authenticated user.
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Both id AND user_id must match — prevents cross-user deletion
    const query = "DELETE FROM cloud_costs WHERE id = $1 AND user_id = $2 RETURNING *;";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cost record not found"
      });
    }

    return res.json({
      success: true,
      message: "Cost record deleted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Error deleting cost record with ID ${req.params.id}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete cost record",
      error: error.message
    });
  }
});

module.exports = router;
