import { fetchCostRecords, fetchAnalytics, fetchRecommendations } from "../services/costApi";

/**
 * Escape string for safe CSV output
 */
export function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const stringVal = String(val).trim();
  if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n") || stringVal.includes("\r")) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

/**
 * Format date string to readable YYYY-MM-DD
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString).split("T")[0];
    return d.toISOString().split("T")[0];
  } catch {
    return String(dateString);
  }
}

/**
 * Fetch all report data for the authenticated user using existing service functions
 */
export async function fetchFullReportData(periodLabel = "Last 6 Months") {
  const periodParam = periodLabel === "Current Billing Period" ? "Last 30 Days" : periodLabel;

  const [costsRes, analyticsRes, recsRes] = await Promise.all([
    fetchCostRecords(),
    fetchAnalytics(periodParam),
    fetchRecommendations(),
  ]);

  const rawCosts = Array.isArray(costsRes?.data) ? costsRes.data : [];
  const rawAnalytics = analyticsRes?.raw || {};
  const formattedAnalytics = analyticsRes?.data || {};
  const rawRecs = Array.isArray(recsRes?.data) ? recsRes.data : [];

  const rawSummary = rawAnalytics.summary || {};
  const totalCost = Number(rawSummary.totalCost || 0);
  const averageCost = Number(rawSummary.averageCost || 0);

  // Aggregate potential savings from user recommendations
  const potentialSavings = rawRecs.reduce(
    (sum, r) => sum + (Number(r.monthlySavings) || 0),
    0
  );

  const activeResources = costsRes?.count !== undefined ? costsRes.count : rawCosts.length;

  // Cost by service
  const costByService = (rawAnalytics.costByService || formattedAnalytics.services || []).map((s) => ({
    service: s.service || s.name || "Other",
    cost: Number(s.cost || s.value || 0),
    percentage: totalCost > 0 ? `${((Number(s.cost || s.value || 0) / totalCost) * 100).toFixed(1)}%` : "0%",
  }));

  // Cost by region
  const costByRegion = (rawAnalytics.costByRegion || formattedAnalytics.regions || []).map((r) => ({
    region: r.region || r.name || "Other",
    cost: Number(r.cost || r.value || 0),
    percentage: totalCost > 0 ? `${((Number(r.cost || r.value || 0) / totalCost) * 100).toFixed(1)}%` : "0%",
  }));

  // Monthly trend
  const monthlyTrend = (rawAnalytics.monthlyTrend || formattedAnalytics.trend || []).map((t) => ({
    month: t.month || t.date || "N/A",
    cost: Number(t.cost || t.current || 0),
  }));

  return {
    summary: {
      totalCost,
      averageCost,
      potentialSavings,
      activeResources,
    },
    costByService,
    costByRegion,
    monthlyTrend,
    recommendations: rawRecs,
    recentCosts: rawCosts.slice(0, 10),
    allCosts: rawCosts,
    periodLabel,
    generatedDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

/**
 * Generate CSV text content according to structured specifications
 */
export function generateCostReportCsv(reportData) {
  const lines = [];

  // Title & Metadata
  lines.push("AI CLOUD COST OPTIMIZER — CLOUD COST & AI OPTIMIZATION REPORT");
  lines.push(`Report Period,${escapeCsv(reportData.periodLabel)}`);
  lines.push(`Generated On,${escapeCsv(reportData.generatedDate)}`);
  lines.push("");

  // SECTION 1 — SUMMARY
  lines.push("SECTION 1 — SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Total Cloud Cost,${escapeCsv(formatCurrency(reportData.summary.totalCost))}`);
  lines.push(`Average Monthly Cost,${escapeCsv(formatCurrency(reportData.summary.averageCost))}`);
  lines.push(`Potential Monthly Savings,${escapeCsv(formatCurrency(reportData.summary.potentialSavings))}`);
  lines.push(`Active Resources,${escapeCsv(reportData.summary.activeResources)}`);
  lines.push("");

  // SECTION 2 — COST BY SERVICE
  lines.push("SECTION 2 — COST BY SERVICE");
  lines.push("Service,Cost,Percentage");
  if (reportData.costByService && reportData.costByService.length > 0) {
    reportData.costByService.forEach((item) => {
      lines.push(`${escapeCsv(item.service)},${escapeCsv(formatCurrency(item.cost))},${escapeCsv(item.percentage)}`);
    });
  } else {
    lines.push("No service records found,₹0,0%");
  }
  lines.push("");

  // SECTION 3 — COST BY REGION
  lines.push("SECTION 3 — COST BY REGION");
  lines.push("Region,Cost,Percentage");
  if (reportData.costByRegion && reportData.costByRegion.length > 0) {
    reportData.costByRegion.forEach((item) => {
      lines.push(`${escapeCsv(item.region)},${escapeCsv(formatCurrency(item.cost))},${escapeCsv(item.percentage)}`);
    });
  } else {
    lines.push("No region records found,₹0,0%");
  }
  lines.push("");

  // SECTION 4 — MONTHLY TREND
  lines.push("SECTION 4 — MONTHLY TREND");
  lines.push("Month,Cost");
  if (reportData.monthlyTrend && reportData.monthlyTrend.length > 0) {
    reportData.monthlyTrend.forEach((item) => {
      lines.push(`${escapeCsv(item.month)},${escapeCsv(formatCurrency(item.cost))}`);
    });
  } else {
    lines.push("No trend data,₹0");
  }
  lines.push("");

  // SECTION 5 — AI RECOMMENDATIONS
  lines.push("SECTION 5 — AI RECOMMENDATIONS");
  lines.push("Provider,Service,Resource,Region,Recommendation,Current Cost,Estimated Cost,Monthly Savings,Savings Percentage,Impact,Category");
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    reportData.recommendations.forEach((item) => {
      lines.push([
        escapeCsv(item.provider || "AWS"),
        escapeCsv(item.service || "Cloud"),
        escapeCsv(item.resource || item.resource_name || "N/A"),
        escapeCsv(item.region || "N/A"),
        escapeCsv(item.recommendedConfig || item.recommendedConfiguration || item.title || "Optimization"),
        escapeCsv(formatCurrency(item.currentCost || 0)),
        escapeCsv(formatCurrency(item.estimatedCost || 0)),
        escapeCsv(formatCurrency(item.monthlySavings || 0)),
        escapeCsv(`${item.savingsPercentage || 0}%`),
        escapeCsv(item.impact || "Medium"),
        escapeCsv(item.category || "Cloud Optimization"),
      ].join(","));
    });
  } else {
    lines.push("All resources optimized,-,-,-,-,₹0,₹0,₹0,0%,-,All resources optimized");
  }
  lines.push("");

  // SECTION 6 — RECENT COST RECORDS
  lines.push("SECTION 6 — RECENT COST RECORDS");
  lines.push("Provider,Service,Region,Resource,Usage Hours,Current Monthly Cost,Previous Monthly Cost,Billing Date");
  if (reportData.allCosts && reportData.allCosts.length > 0) {
    reportData.allCosts.slice(0, 15).forEach((item) => {
      lines.push([
        escapeCsv(item.provider || "AWS"),
        escapeCsv(item.service || "Cloud"),
        escapeCsv(item.region || "N/A"),
        escapeCsv(item.resource_name || item.resource || "N/A"),
        escapeCsv(item.usage_hours !== null && item.usage_hours !== undefined ? item.usage_hours : "N/A"),
        escapeCsv(formatCurrency(item.current_monthly_cost || item.currentCost || 0)),
        escapeCsv(formatCurrency(item.previous_monthly_cost || item.previousCost || item.current_monthly_cost || 0)),
        escapeCsv(formatDate(item.billing_date || item.created_at)),
      ].join(","));
    });
  } else {
    lines.push("No cost records found,-,-,-,-,₹0,₹0,-");
  }
  lines.push("");

  // DISCLAIMER
  lines.push("DISCLAIMER");
  lines.push('"AI-generated savings figures are estimates based on available cloud usage and cost data. Actual savings may vary depending on resource configuration, workload, pricing, and billing conditions."');

  return lines.join("\r\n");
}

/**
 * Trigger file download in browser
 */
export function downloadCsvFile(csvContent, filename) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
