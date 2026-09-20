const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * GET /api/analytics
 * Fetch dynamic cloud cost analytics calculated from PostgreSQL `cloud_costs` table.
 * Results are SCOPED to the authenticated user only.
 * Supports query parameter: ?period=7days|30days|3months|6months|12months (default: 6months)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || "6months";

    let intervalStr = "6 months";
    if (period === "7days") intervalStr = "7 days";
    else if (period === "30days") intervalStr = "30 days";
    else if (period === "3months") intervalStr = "3 months";
    else if (period === "6months") intervalStr = "6 months";
    else if (period === "12months") intervalStr = "12 months";

    // Query records matching the requested period for this user only
    const query = `
      SELECT * FROM cloud_costs
      WHERE user_id = $1
        AND COALESCE(billing_date, created_at::date) >= CURRENT_DATE - ($2::INTERVAL)
      ORDER BY COALESCE(billing_date, created_at::date) ASC;
    `;

    let result = await pool.query(query, [userId, intervalStr]);

    // Fallback: If no records fall within the strict interval, check if ANY records exist for this user
    if (result.rows.length === 0) {
      const fallbackQuery = "SELECT * FROM cloud_costs WHERE user_id = $1 ORDER BY COALESCE(billing_date, created_at::date) ASC;";
      result = await pool.query(fallbackQuery, [userId]);
    }

    const rows = result.rows;

    // --- 1. Summary Metrics ---
    const totalCost = rows.reduce((sum, r) => sum + parseFloat(r.current_monthly_cost || 0), 0);
    const count = rows.length;
    const averageCost = count > 0 ? totalCost / count : 0;

    const totalPrev = rows.reduce((sum, r) => {
      const prev = r.previous_monthly_cost !== null && r.previous_monthly_cost !== undefined
        ? parseFloat(r.previous_monthly_cost)
        : parseFloat(r.current_monthly_cost || 0);
      return sum + prev;
    }, 0);

    let costIncrease = 0;
    if (totalPrev > 0) {
      costIncrease = parseFloat((((totalCost - totalPrev) / totalPrev) * 100).toFixed(1));
    }

    // --- 2. Cost by Service ---
    const serviceMap = {};
    rows.forEach((r) => {
      const cost = parseFloat(r.current_monthly_cost || 0);
      const svc = r.service || "Other";
      serviceMap[svc] = (serviceMap[svc] || 0) + cost;
    });

    const costByService = Object.entries(serviceMap)
      .map(([service, cost]) => ({
        name: service,
        service: service,
        value: cost,
        cost: cost
      }))
      .sort((a, b) => b.cost - a.cost);

    let highestCostService = "No data";
    let highestCostServiceCost = 0;
    if (costByService.length > 0) {
      highestCostService = costByService[0].service;
      highestCostServiceCost = costByService[0].cost;
    }

    // --- 3. Cost by Cloud Provider ---
    const providerMap = {};
    rows.forEach((r) => {
      const cost = parseFloat(r.current_monthly_cost || 0);
      const prov = r.provider || "Other";
      providerMap[prov] = (providerMap[prov] || 0) + cost;
    });

    const costByProvider = Object.entries(providerMap)
      .map(([provider, cost]) => ({
        name: provider,
        provider: provider,
        value: cost,
        cost: cost
      }))
      .sort((a, b) => b.cost - a.cost);

    // --- 4. Cost by Region ---
    const regionMap = {};
    rows.forEach((r) => {
      const cost = parseFloat(r.current_monthly_cost || 0);
      const reg = r.region || "Other";
      regionMap[reg] = (regionMap[reg] || 0) + cost;
    });

    const costByRegion = Object.entries(regionMap)
      .map(([region, cost]) => ({
        name: region,
        region: region,
        value: cost,
        cost: cost
      }))
      .sort((a, b) => b.cost - a.cost);

    // --- 5. Monthly / Daily Trend & Current vs Previous ---
    const isDays = period === "7days" || period === "30days";
    const keyName = isDays ? "date" : "month";
    const trendMap = {};

    rows.forEach((r) => {
      const dateObj = new Date(r.billing_date || r.created_at || Date.now());
      let label = "";
      if (period === "7days") {
        label = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      } else if (period === "30days") {
        label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        label = dateObj.toLocaleDateString("en-US", { month: "short" });
      }

      if (!trendMap[label]) {
        trendMap[label] = { current: 0, previous: 0 };
      }

      const curr = parseFloat(r.current_monthly_cost || 0);
      const prev = r.previous_monthly_cost !== null && r.previous_monthly_cost !== undefined
        ? parseFloat(r.previous_monthly_cost)
        : curr;

      trendMap[label].current += curr;
      trendMap[label].previous += prev;
    });

    const monthlyTrend = Object.entries(trendMap).map(([label, val]) => ({
      [keyName]: label,
      cost: val.current
    }));

    const currentVsPrevious = Object.entries(trendMap).map(([label, val]) => ({
      [keyName]: label,
      category: label,
      current: val.current,
      previous: val.previous
    }));

    // --- 6. Cost Insights ---
    let highestCostDriver = {
      id: 1,
      title: "Highest Cost Driver",
      description: "No cloud cost records available for analysis.",
      type: "info"
    };

    if (highestCostService !== "No data") {
      const percent = totalCost > 0 ? ((highestCostServiceCost / totalCost) * 100).toFixed(0) : 0;
      highestCostDriver = {
        id: 1,
        title: "Highest Cost Driver",
        description: `${highestCostService} is currently the highest-cost service accounting for ₹${highestCostServiceCost.toLocaleString()} (${percent}%) of total cloud spending.`,
        type: "warning"
      };
    }

    let spendingIncrease = {
      id: 2,
      title: "Spending Stability",
      description: "Cloud spending is stable across billing periods.",
      type: "info"
    };

    if (costIncrease > 0) {
      spendingIncrease = {
        id: 2,
        title: "Spending Increase",
        description: `Cloud spending has increased by +${costIncrease}% compared with previous billing records.`,
        type: "trending-up"
      };
    } else if (costIncrease < 0) {
      spendingIncrease = {
        id: 2,
        title: "Cost Reduction",
        description: `Cloud spending reduced by ${costIncrease}% compared with previous billing records.`,
        type: "lightbulb"
      };
    }

    let optimizationOpportunity = {
      id: 3,
      title: "Optimization Opportunity",
      description: "Optimization analysis requires resource utilization data.",
      type: "lightbulb"
    };

    const underutilized = rows.find(r => r.cpu_utilization !== null && parseFloat(r.cpu_utilization) < 40);
    if (underutilized) {
      const resName = underutilized.resource_name || underutilized.service;
      optimizationOpportunity = {
        id: 3,
        title: "Optimization Opportunity",
        description: `${resName} in ${underutilized.region} shows ${underutilized.cpu_utilization}% CPU utilization. Downsizing could yield immediate savings.`,
        type: "lightbulb"
      };
    } else if (rows.length > 0) {
      optimizationOpportunity = {
        id: 3,
        title: "Optimization Opportunity",
        description: "Optimization analysis requires utilization data.",
        type: "lightbulb"
      };
    }

    let providerDistribution = {
      id: 4,
      title: "Provider Distribution",
      description: "No cloud provider distribution data available.",
      type: "info"
    };

    if (costByProvider.length > 0) {
      const topProv = costByProvider[0];
      const provPercent = totalCost > 0 ? ((topProv.cost / totalCost) * 100).toFixed(0) : 0;
      providerDistribution = {
        id: 4,
        title: "Provider Distribution",
        description: `${topProv.provider} accounts for the largest portion (${provPercent}%) of total cloud infrastructure spending.`,
        type: "info"
      };
    }

    return res.json({
      success: true,
      period: period,
      summary: {
        totalCost,
        averageCost,
        costIncrease,
        highestCostService,
        highestCostServiceCost
      },
      monthlyTrend,
      costByService,
      costByProvider,
      costByRegion,
      currentVsPrevious,
      insights: {
        highestCostDriver,
        spendingIncrease,
        optimizationOpportunity,
        providerDistribution
      }
    });
  } catch (error) {
    console.error("Error generating analytics:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics",
      error: error.message
    });
  }
});

module.exports = router;
