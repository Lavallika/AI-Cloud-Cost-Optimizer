const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

// In-memory status store to persist "Reviewed" status across user actions
const reviewStatusStore = new Map();

/**
 * Fallback rule engine when ML service is offline or unreachable
 */
function evaluateRuleFallback(row) {
  const currentCost = parseFloat(row.current_monthly_cost || 0);
  const cpu = row.cpu_utilization !== null ? parseFloat(row.cpu_utilization) : null;
  const memory = row.memory_utilization !== null ? parseFloat(row.memory_utilization) : null;
  const storage = row.storage_utilization !== null ? parseFloat(row.storage_utilization) : null;
  const usageHours = row.usage_hours !== null ? parseFloat(row.usage_hours) : 720;
  const dataTransfer = row.data_transfer_gb !== null ? parseFloat(row.data_transfer_gb) : 0;

  const recs = [];

  // Compute underutilization
  if (cpu !== null && cpu < 30) {
    const savingsRatio = cpu < 20 ? 0.25 : 0.15;
    recs.push({
      title: `Right-size ${row.provider} ${row.service} Instance`,
      description: `${row.service} CPU utilization is low (${cpu.toFixed(1)}%). Downsize instance to reduce compute allocation without impacting performance.`,
      impact: cpu < 20 ? "High" : "Medium",
      savingsRatio,
      category: "Compute Optimization"
    });
  }

  // Memory underutilization
  if (memory !== null && memory < 30) {
    recs.push({
      title: `Optimize ${row.service} Memory Allocation`,
      description: `Memory utilization is only ${memory.toFixed(1)}%. Switch to an instance type with balanced memory configuration.`,
      impact: "Medium",
      savingsRatio: 0.15,
      category: "Memory Optimization"
    });
  }

  // Storage underutilization
  if (storage !== null && storage < 40) {
    recs.push({
      title: `Optimize ${row.service} Storage Tier`,
      description: `Storage utilization is at ${storage.toFixed(1)}%. Migrate infrequently accessed data to cost-effective storage tiers.`,
      impact: storage < 20 ? "Medium" : "Low",
      savingsRatio: 0.12,
      category: "Storage Optimization"
    });
  }

  // Non-continuous usage scheduling
  if (usageHours < 500) {
    recs.push({
      title: "Implement Automated Off-Hours Scheduling",
      description: `Resource runs only ${usageHours} hours/month. Set up auto-stop schedules outside working hours to cut idle costs.`,
      impact: usageHours < 300 ? "High" : "Medium",
      savingsRatio: 0.20,
      category: "Usage Scheduling"
    });
  }

  // High data transfer
  if (dataTransfer > 200) {
    recs.push({
      title: "Optimize Cross-Region Data Transfer",
      description: `High data transfer volume observed (${dataTransfer} GB). Review routing paths and utilize local cache/CDN endpoints.`,
      impact: "Medium",
      savingsRatio: 0.10,
      category: "Network Optimization"
    });
  }

  return recs.map((r) => {
    const savings = Math.round(currentCost * r.savingsRatio);
    return {
      title: r.title,
      description: r.description,
      impact: r.impact,
      estimated_savings: savings,
      category: r.category
    };
  });
}

/**
 * GET /api/recommendations
 * Generates dynamic recommendations from PostgreSQL cloud_costs records using ML optimization engine
 */
router.get("/", async (req, res) => {
  try {
    // 1. Fetch all cloud cost records from PostgreSQL
    const query = "SELECT * FROM cloud_costs ORDER BY id ASC;";
    const dbResult = await pool.query(query);
    const rows = dbResult.rows;

    // 2. Filter records that have utilization data
    const eligibleRows = rows.filter((row) => {
      const hasCpu = row.cpu_utilization !== null && row.cpu_utilization !== undefined && row.cpu_utilization !== "";
      const hasMem = row.memory_utilization !== null && row.memory_utilization !== undefined && row.memory_utilization !== "";
      const hasStorage = row.storage_utilization !== null && row.storage_utilization !== undefined && row.storage_utilization !== "";
      return hasCpu || hasMem || hasStorage;
    });

    // If no records have utilization metrics, return clean empty list
    if (eligibleRows.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: "No cloud cost records with utilization data found"
      });
    }

    const recommendations = [];

    // 3. Process each eligible record through ML service or fallback
    for (const row of eligibleRows) {
      const currentCost = parseFloat(row.current_monthly_cost || 0);
      const cpu = row.cpu_utilization !== null ? parseFloat(row.cpu_utilization) : 0;
      const mem = row.memory_utilization !== null ? parseFloat(row.memory_utilization) : 0;
      const storage = row.storage_utilization !== null ? parseFloat(row.storage_utilization) : 0;
      const usage = row.usage_hours !== null ? parseFloat(row.usage_hours) : 720;
      const requests = row.request_count !== null ? parseFloat(row.request_count) : 1000;
      const transfer = row.data_transfer_gb !== null ? parseFloat(row.data_transfer_gb) : 0;

      let mlRecs = [];
      let mlPredictedCost = currentCost;

      try {
        const mlPayload = {
          provider: row.provider || "AWS",
          service: row.service || "EC2",
          region: row.region || "Mumbai",
          cpu_utilization: cpu,
          memory_utilization: mem,
          storage_utilization: storage,
          usage_hours: usage,
          request_count: requests,
          data_transfer_gb: transfer
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const mlRes = await fetch(`${ML_SERVICE_URL}/api/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mlPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData.success && Array.isArray(mlData.recommendations) && mlData.recommendations.length > 0) {
            mlRecs = mlData.recommendations;
            if (mlData.predicted_monthly_cost) {
              mlPredictedCost = mlData.predicted_monthly_cost;
            }
          }
        }
      } catch (mlErr) {
        console.warn(`ML service optimize call failed for record ${row.id}: ${mlErr.message}. Falling back to rule engine.`);
      }

      // If ML service didn't return recommendations, use fallback rules
      if (mlRecs.length === 0) {
        mlRecs = evaluateRuleFallback(row);
      }

      // Build current configuration summary text
      const configParts = [];
      if (row.usage_hours !== null) configParts.push(`${parseFloat(row.usage_hours)} hrs/mo`);
      if (row.cpu_utilization !== null) configParts.push(`CPU: ${parseFloat(row.cpu_utilization).toFixed(1)}%`);
      if (row.memory_utilization !== null) configParts.push(`Mem: ${parseFloat(row.memory_utilization).toFixed(1)}%`);
      if (row.storage_utilization !== null) configParts.push(`Storage: ${parseFloat(row.storage_utilization).toFixed(1)}%`);
      const currentConfigDesc = configParts.length > 0 ? configParts.join(" • ") : "Standard Configuration";

      const resourceName = row.resource_name || `${row.service} Resource`;
      const resourceId = `RES-${String(row.id).padStart(4, "0")}`;

      // Create recommendation cards
      mlRecs.forEach((item, recIdx) => {
        const recId = `rec-${row.id}-${recIdx + 1}`;
        const storedStatus = reviewStatusStore.get(recId) || "New";

        // Calculate realistic savings based on current monthly cost
        let savings = 0;
        if (item.estimated_savings && mlPredictedCost > 0) {
          const ratio = item.estimated_savings / mlPredictedCost;
          savings = Math.round(currentCost * Math.min(ratio, 0.45));
        } else if (item.estimated_savings) {
          savings = Math.min(Math.round(item.estimated_savings), Math.round(currentCost * 0.4));
        } else {
          savings = Math.round(currentCost * 0.20);
        }

        if (savings <= 0 && currentCost > 0) {
          savings = Math.round(currentCost * 0.15);
        }

        const estimatedOptimizedCost = Math.max(0, currentCost - savings);
        const savingsPct = currentCost > 0 ? Math.round((savings / currentCost) * 100) : 0;

        let impact = item.impact;
        if (!impact) {
          if (savingsPct >= 25) impact = "High";
          else if (savingsPct >= 15) impact = "Medium";
          else impact = "Low";
        }

        recommendations.push({
          id: recId,
          dbId: row.id,
          provider: row.provider,
          service: row.service,
          resource: resourceName,
          resourceId: resourceId,
          region: row.region,
          currentConfiguration: currentConfigDesc,
          currentConfig: currentConfigDesc,
          recommendedConfiguration: item.title,
          recommendedConfig: item.title,
          currentCost: Math.round(currentCost),
          estimatedCost: Math.round(estimatedOptimizedCost),
          monthlySavings: savings,
          savingsPercentage: savingsPct,
          impact: impact,
          status: storedStatus,
          reason: item.description,
          category: item.category || "Cloud Optimization"
        });
      });
    }

    return res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error("Error generating recommendations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message
    });
  }
});

/**
 * PATCH /api/recommendations/:id/status
 * Update the review status of a recommendation
 */
router.patch("/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status = "Reviewed" } = req.body;

    reviewStatusStore.set(id, status);

    return res.json({
      success: true,
      message: `Recommendation ${id} status updated to ${status}`,
      id,
      status
    });
  } catch (error) {
    console.error(`Error updating status for recommendation ${req.params.id}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update recommendation status",
      error: error.message
    });
  }
});

module.exports = router;
