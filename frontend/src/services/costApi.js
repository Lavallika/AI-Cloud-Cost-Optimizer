const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Normalize raw PostgreSQL row into standard frontend record structure
 */
export function normalizeCostRecord(row) {
  if (!row) return null;

  const currentCost = parseFloat(row.current_monthly_cost || row.currentCost || 0);
  const previousCost =
    row.previous_monthly_cost !== null && row.previous_monthly_cost !== undefined
      ? parseFloat(row.previous_monthly_cost)
      : row.previousCost !== undefined && row.previousCost !== null
      ? parseFloat(row.previousCost)
      : currentCost;

  let trend = row.trend;
  if (trend === undefined || trend === null) {
    if (previousCost > 0) {
      trend = parseFloat((((currentCost - previousCost) / previousCost) * 100).toFixed(1));
    } else {
      trend = 0;
    }
  } else {
    trend = parseFloat(trend);
  }

  let status = row.status;
  if (!status) {
    if (trend > 5) status = "High";
    else if (trend < 0) status = "Optimized";
    else status = "Normal";
  }

  let usage = row.usage;
  if (!usage) {
    const hours =
      row.usage_hours !== null && row.usage_hours !== undefined
        ? parseFloat(row.usage_hours)
        : null;
    usage = hours !== null ? `${hours} Hours` : "N/A";
  }

  const resourceName = row.resource_name || row.resource || "";
  const billingDateStr = row.billing_date ? String(row.billing_date).split("T")[0] : row.billingDate || "";

  const details =
    row.details ||
    (resourceName
      ? `${resourceName}${billingDateStr ? ` — added on ${billingDateStr}` : ""}`
      : `${row.service} resource in ${row.region}`);

  return {
    ...row,
    id: row.id,
    provider: row.provider,
    service: row.service,
    region: row.region,
    resource: resourceName,
    resource_name: resourceName,
    usage_hours:
      row.usage_hours !== null && row.usage_hours !== undefined
        ? parseFloat(row.usage_hours)
        : null,
    usage: usage,
    currentCost: currentCost,
    current_monthly_cost: currentCost,
    previousCost: previousCost,
    previous_monthly_cost: previousCost,
    trend: trend,
    status: status,
    details: details,
    billingDate: billingDateStr,
    billing_date: billingDateStr
  };
}

/**
 * Fetch all cloud cost records from PostgreSQL
 * GET /api/costs
 */
export async function fetchCostRecords() {
  try {
    const response = await fetch(`${API_URL}/api/costs`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch cost records (${response.status})`);
    }

    const json = await response.json();

    if (json.success && Array.isArray(json.data)) {
      return {
        success: true,
        data: json.data.map(normalizeCostRecord),
        count: json.count || json.data.length,
      };
    }

    return {
      success: false,
      error: "Invalid API response structure",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching cost records:", error);
    return {
      success: false,
      error: error.message || "Network error fetching cost records",
      data: [],
    };
  }
}

/**
 * Create a new cloud cost record in PostgreSQL
 * POST /api/costs
 */
export async function createCostRecord(recordData) {
  try {
    const getNumericOrNull = (val1, val2) => {
      if (val1 !== undefined && val1 !== null && val1 !== "") {
        const num = Number(val1);
        return !isNaN(num) ? num : null;
      }
      if (val2 !== undefined && val2 !== null && val2 !== "") {
        const num = Number(val2);
        return !isNaN(num) ? num : null;
      }
      return null;
    };

    const payload = {
      provider: recordData.provider,
      service: recordData.service,
      region: recordData.region,
      resource_name: recordData.resource_name || recordData.resource,
      usage_hours: recordData.usage_hours !== undefined ? recordData.usage_hours : recordData.usage,
      current_monthly_cost: recordData.current_monthly_cost !== undefined ? recordData.current_monthly_cost : recordData.currentCost,
      previous_monthly_cost: recordData.previous_monthly_cost !== undefined ? recordData.previous_monthly_cost : recordData.previousCost,
      cpu_utilization: getNumericOrNull(recordData.cpu_utilization, recordData.cpuUtilization),
      memory_utilization: getNumericOrNull(recordData.memory_utilization, recordData.memoryUtilization),
      storage_utilization: getNumericOrNull(recordData.storage_utilization, recordData.storageUtilization),
      request_count: getNumericOrNull(recordData.request_count, recordData.requestCount),
      data_transfer_gb: getNumericOrNull(recordData.data_transfer_gb, recordData.dataTransferGb),
      billing_date: recordData.billing_date || recordData.billingDate || null,
    };

    const response = await fetch(`${API_URL}/api/costs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to create cost record");
    }

    return {
      success: true,
      message: json.message || "Cost record created successfully",
      data: normalizeCostRecord(json.data),
    };
  } catch (error) {
    console.error("Error creating cost record:", error);
    return {
      success: false,
      error: error.message || "Network error creating cost record",
    };
  }
}

/**
 * Delete a cost record by ID from PostgreSQL
 * DELETE /api/costs/:id
 */
export async function deleteCostRecord(id) {
  try {
    const response = await fetch(`${API_URL}/api/costs/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to delete cost record");
    }

    return {
      success: true,
      message: json.message || "Cost record deleted successfully",
      data: normalizeCostRecord(json.data),
    };
  } catch (error) {
    console.error(`Error deleting cost record ID ${id}:`, error);
    return {
      success: false,
      error: error.message || "Network error deleting cost record",
    };
  }
}

/**
 * Fetch dynamic cloud cost analytics from PostgreSQL
 * GET /api/analytics?period=<period>
 */
export async function fetchAnalytics(periodLabel = "Last 6 Months") {
  const periodMap = {
    "Last 7 Days": "7days",
    "Last 30 Days": "30days",
    "Last 3 Months": "3months",
    "Last 6 Months": "6months",
    "Last 12 Months": "12months",
  };

  const periodCode = periodMap[periodLabel] || periodLabel || "6months";

  try {
    const response = await fetch(`${API_URL}/api/analytics?period=${periodCode}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch analytics (${response.status})`);
    }

    const json = await response.json();

    if (json.success) {
      return {
        success: true,
        data: formatAnalyticsData(json, periodLabel),
        raw: json,
      };
    }

    return {
      success: false,
      error: "Invalid API response structure from analytics endpoint",
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      success: false,
      error: error.message || "Network error fetching analytics",
    };
  }
}

/**
 * Format raw backend analytics JSON to match frontend component prop structures
 */
export function formatAnalyticsData(apiData, periodLabel) {
  const isDays = periodLabel === "Last 7 Days" || periodLabel === "Last 30 Days";
  const trendKey = isDays ? "date" : "month";
  const comparisonKey = trendKey;

  const totalCostVal = apiData.summary?.totalCost || 0;
  const avgCostVal = apiData.summary?.averageCost || 0;
  const costIncVal = apiData.summary?.costIncrease || 0;
  const highestService = apiData.summary?.highestCostService || "No data";
  const highestServiceCost = apiData.summary?.highestCostServiceCost || 0;

  const periodSubtitles = {
    "Last 7 Days": "Selected 7-day period",
    "Last 30 Days": "Selected 30-day period",
    "Last 3 Months": "Selected 3-month period",
    "Last 6 Months": "Selected 6-month period",
    "Last 12 Months": "Selected 12-month period",
  };

  const avgSubtitles = {
    "Last 7 Days": "Daily average",
    "Last 30 Days": "Weekly average",
    "Last 3 Months": "Monthly average",
    "Last 6 Months": "Across selected period",
    "Last 12 Months": "Annual monthly average",
  };

  const serviceColors = ["#2563eb", "#0284c7", "#4f46e5", "#0d9488", "#d97706", "#dc2626", "#64748b"];
  const providerColors = { AWS: "#d97706", Azure: "#2563eb", GCP: "#10b981" };
  const regionColors = ["#3b82f6", "#6366f1", "#0ea5e9", "#10b981", "#8b5cf6", "#94a3b8"];

  const services = (apiData.costByService || []).map((item, idx) => ({
    service: item.service || item.name,
    cost: Number(item.cost || item.value || 0),
    color: serviceColors[idx % serviceColors.length]
  }));

  const providers = (apiData.costByProvider || []).map((item) => ({
    provider: item.provider || item.name,
    cost: Number(item.cost || item.value || 0),
    color: providerColors[item.provider || item.name] || "#64748b"
  }));

  const regions = (apiData.costByRegion || []).map((item, idx) => ({
    region: item.region || item.name,
    cost: Number(item.cost || item.value || 0),
    color: regionColors[idx % regionColors.length]
  }));

  const trend = (apiData.monthlyTrend || []).map((item) => ({
    [trendKey]: item[trendKey] || item.month || item.date || "N/A",
    cost: Number(item.cost || item.current || 0)
  }));

  const comparison = (apiData.currentVsPrevious || []).map((item) => ({
    [comparisonKey]: item[comparisonKey] || item.month || item.date || item.category || "N/A",
    current: Number(item.current || 0),
    previous: Number(item.previous || 0)
  }));

  const insightsArr = [];
  if (apiData.insights) {
    if (apiData.insights.highestCostDriver) insightsArr.push(apiData.insights.highestCostDriver);
    if (apiData.insights.spendingIncrease) insightsArr.push(apiData.insights.spendingIncrease);
    if (apiData.insights.optimizationOpportunity) insightsArr.push(apiData.insights.optimizationOpportunity);
    if (apiData.insights.providerDistribution) insightsArr.push(apiData.insights.providerDistribution);
  }

  return {
    trendTitle: isDays ? "Daily Cloud Cost Trend" : "Monthly Cloud Cost Trend",
    trendKey: trendKey,
    trend: trend,
    services: services,
    providers: providers,
    regions: regions,
    comparisonKey: comparisonKey,
    comparison: comparison,
    summary: {
      totalCost: `₹${totalCostVal.toLocaleString()}`,
      totalCostSubtitle: periodSubtitles[periodLabel] || "Selected period",
      avgCost: `₹${Math.round(avgCostVal).toLocaleString()}`,
      avgCostSubtitle: avgSubtitles[periodLabel] || "Average cost",
      costIncrease: `${costIncVal >= 0 ? "+" : ""}${costIncVal}%`,
      costIncreaseSubtitle: "Compared with previous period",
      highestService: highestService,
      highestServiceSubtitle: highestServiceCost > 0 ? `₹${highestServiceCost.toLocaleString()}` : "₹0",
    },
    insights: insightsArr
  };
}

/**
 * Fetch dynamic AI optimization recommendations generated from PostgreSQL records and ML engine
 * GET /api/recommendations
 */
export async function fetchRecommendations() {
  try {
    const response = await fetch(`${API_URL}/api/recommendations`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch recommendations (${response.status})`);
    }

    const json = await response.json();

    if (json.success && Array.isArray(json.data)) {
      return {
        success: true,
        data: json.data,
        count: json.count !== undefined ? json.count : json.data.length,
      };
    }

    return {
      success: false,
      error: "Invalid API response format from recommendations endpoint",
      data: [],
    };
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return {
      success: false,
      error: error.message || "Network error fetching recommendations",
      data: [],
    };
  }
}

/**
 * Update the review status of a recommendation
 * PATCH /api/recommendations/:id/status
 */
export async function updateRecommendationStatus(id, status = "Reviewed") {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to update recommendation status");
    }

    return {
      success: true,
      message: json.message || "Status updated successfully",
      data: json,
    };
  } catch (error) {
    console.error(`Error updating status for recommendation ${id}:`, error);
    return {
      success: false,
      error: error.message || "Network error updating recommendation status",
    };
  }
}
