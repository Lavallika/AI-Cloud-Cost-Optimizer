import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  Cloud,
  Calendar,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import CostChart from "../components/dashboard/CostChart";
import ServiceCostBreakdown from "../components/dashboard/ServiceCostBreakdown";
import AIRecommendation from "../components/dashboard/AIRecommendation";
import RecentCostActivity from "../components/dashboard/RecentCostActivity";
import QuickActions from "../components/dashboard/QuickActions";
import { fetchCostRecords, fetchAnalytics, fetchRecommendations } from "../services/costApi";

const INITIAL_DASHBOARD_DATA = {
  totalCost: 0,
  monthlyCost: 0,
  potentialSavings: 0,
  activeResources: 0,
  monthlyTrend: [],
  costByService: [],
  topRecommendation: null,
  recentActivities: [],
};

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [costsRes, analyticsRes, recsRes] = await Promise.all([
        fetchCostRecords(),
        fetchAnalytics("Last 6 Months"),
        fetchRecommendations(),
      ]);

      // 1. Cost records & active resources
      const costList = Array.isArray(costsRes?.data) ? costsRes.data : [];
      const activeResourcesCount = costsRes?.count !== undefined ? costsRes.count : costList.length;

      // 2. Analytics summary, monthly trend, and cost by service
      const rawAnalytics = analyticsRes?.raw || {};
      const formattedAnalytics = analyticsRes?.data || {};

      const rawSummary = rawAnalytics.summary || {};
      const totalCostVal = rawSummary.totalCost !== undefined ? Number(rawSummary.totalCost) : 0;
      const avgCostVal = rawSummary.averageCost !== undefined ? Number(rawSummary.averageCost) : 0;

      const trendList = Array.isArray(formattedAnalytics.trend) && formattedAnalytics.trend.length > 0
        ? formattedAnalytics.trend
        : Array.isArray(rawAnalytics.monthlyTrend)
        ? rawAnalytics.monthlyTrend.map((t) => ({
            month: t.month || t.date || "N/A",
            cost: Number(t.cost || t.current || 0),
          }))
        : [];

      const serviceList = Array.isArray(formattedAnalytics.services) && formattedAnalytics.services.length > 0
        ? formattedAnalytics.services
        : Array.isArray(rawAnalytics.costByService)
        ? rawAnalytics.costByService.map((s) => ({
            name: s.service || s.name || "Other",
            cost: Number(s.cost || s.value || 0),
          }))
        : [];

      // 3. AI recommendations and potential savings aggregate
      const recList = Array.isArray(recsRes?.data) ? recsRes.data : [];
      const totalSavings = recList.reduce(
        (sum, r) => sum + (Number(r.monthlySavings) || 0),
        0
      );

      // Top recommendation sorted by highest monthly savings
      const sortedRecs = recList
        .slice()
        .sort((a, b) => (Number(b.monthlySavings) || 0) - (Number(a.monthlySavings) || 0));
      const topRec = sortedRecs.length > 0 ? sortedRecs[0] : null;

      // 4. Recent activities: latest 3 cost records
      const recentList = costList.slice(0, 3);

      setDashboardData({
        totalCost: totalCostVal,
        monthlyCost: avgCostVal,
        potentialSavings: totalSavings,
        activeResources: activeResourcesCount,
        monthlyTrend: trendList,
        costByService: serviceList,
        topRecommendation: topRec,
        recentActivities: recentList,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and optimize your cloud costs
          </p>
        </div>

        {/* Current Billing Period Badge */}
        <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar size={14} className="text-indigo-600" />
          <span>Current billing period</span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 1. Four Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Cloud Cost"
          value={isLoading ? "..." : `₹${Math.round(dashboardData.totalCost).toLocaleString()}`}
          subtitle="This month"
          icon={DollarSign}
        />

        <StatCard
          title="Monthly Cost"
          value={isLoading ? "..." : `₹${Math.round(dashboardData.monthlyCost).toLocaleString()}`}
          subtitle="Current month"
          icon={TrendingUp}
        />

        <StatCard
          title="Potential Savings"
          value={isLoading ? "..." : `₹${Math.round(dashboardData.potentialSavings).toLocaleString()}`}
          subtitle="AI estimated"
          icon={PiggyBank}
        />

        <StatCard
          title="Active Resources"
          value={isLoading ? "..." : String(dashboardData.activeResources)}
          subtitle="Active cloud resources"
          icon={Cloud}
        />
      </div>

      {/* 2. Visual Cost Overview: Line Chart & Service Cost Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2">
          <CostChart data={dashboardData.monthlyTrend} />
        </div>
        <div className="lg:col-span-1">
          <ServiceCostBreakdown data={dashboardData.costByService} />
        </div>
      </div>

      {/* 3. AI Cost Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <AIRecommendation recommendation={dashboardData.topRecommendation} />
        <RecentCostActivity activities={dashboardData.recentActivities} />
      </div>

      {/* 4. Quick Navigation Actions */}
      <QuickActions />
    </div>
  );
}

export default Dashboard;