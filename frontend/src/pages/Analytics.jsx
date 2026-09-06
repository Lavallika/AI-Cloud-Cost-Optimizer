import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Flame,
  Calendar,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import MonthlyCostChart from "../components/analytics/MonthlyCostChart";
import ServiceCostChart from "../components/analytics/ServiceCostChart";
import ProviderCostChart from "../components/analytics/ProviderCostChart";
import RegionCostChart from "../components/analytics/RegionCostChart";
import CostComparisonChart from "../components/analytics/CostComparisonChart";
import CostInsights from "../components/analytics/CostInsights";
import { fetchAnalytics } from "../services/costApi";

// Default empty state structure when backend returns no records or during load errors
const EMPTY_ANALYTICS = {
  trendTitle: "Monthly Cloud Cost Trend",
  trendKey: "month",
  trend: [],
  services: [],
  providers: [],
  regions: [],
  comparisonKey: "month",
  comparison: [],
  summary: {
    totalCost: "₹0",
    totalCostSubtitle: "Selected period",
    avgCost: "₹0",
    avgCostSubtitle: "Average cost",
    costIncrease: "0%",
    costIncreaseSubtitle: "Compared with previous period",
    highestService: "No data",
    highestServiceSubtitle: "₹0",
  },
  insights: [
    {
      id: 1,
      title: "Highest Cost Driver",
      description: "No cloud cost records available for analysis.",
      type: "info",
    },
    {
      id: 2,
      title: "Spending Stability",
      description: "Cloud spending data unavailable.",
      type: "info",
    },
    {
      id: 3,
      title: "Optimization Opportunity",
      description: "Optimization analysis requires resource cost records.",
      type: "lightbulb",
    },
    {
      id: 4,
      title: "Provider Distribution",
      description: "No cloud provider distribution data available.",
      type: "info",
    },
  ],
};

function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 Months");
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch analytics data from PostgreSQL API
  const loadAnalytics = useCallback(async (period) => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await fetchAnalytics(period);
    if (res.success && res.data) {
      setAnalyticsData(res.data);
    } else {
      const err = res.error || "Failed to connect to analytics server.";
      setErrorMsg(err);
      toast.error(err);
      setAnalyticsData(EMPTY_ANALYTICS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics(selectedPeriod);
  }, [selectedPeriod, loadAnalytics]);

  const handlePeriodChange = (e) => {
    const selected = e.target.value;
    setSelectedPeriod(selected);
    toast.info(`Updated analytics for ${selected}`);
  };

  const currentData = analyticsData;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cloud Cost Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze spending trends and identify opportunities to optimize cloud costs.
          </p>
        </div>

        {/* Time Period Selector Dropdown */}
        <div className="relative inline-flex items-center gap-2 self-start sm:self-auto">
          <Calendar size={16} className="text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="pl-9 pr-8 py-2 text-sm bg-white border border-slate-200/80 rounded-xl text-slate-900 font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last 12 Months">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Loading Banner / Error Banner */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-500 text-sm font-medium">
          Loading PostgreSQL cloud cost analytics...
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-700 font-medium">
          {errorMsg} — Unable to fetch live analytics from database.
        </div>
      ) : null}

      {/* 1. Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Cost"
          value={currentData.summary.totalCost}
          subtitle={currentData.summary.totalCostSubtitle}
          icon={DollarSign}
        />

        <StatCard
          title="Average Cost"
          value={currentData.summary.avgCost}
          subtitle={currentData.summary.avgCostSubtitle}
          icon={TrendingUp}
        />

        <StatCard
          title="Cost Increase"
          value={currentData.summary.costIncrease}
          subtitle={currentData.summary.costIncreaseSubtitle}
          icon={AlertTriangle}
        />

        <StatCard
          title="Highest Cost Service"
          value={currentData.summary.highestService}
          subtitle={currentData.summary.highestServiceSubtitle}
          icon={Flame}
        />
      </div>

      {/* 2. Dynamic Monthly/Daily Cloud Cost Trend Chart (Full Width) */}
      <MonthlyCostChart
        data={currentData.trend}
        title={currentData.trendTitle}
        dataKey={currentData.trendKey}
      />

      {/* 3. Dynamic Service Cost & Provider Share Charts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <ServiceCostChart data={currentData.services} />
        <ProviderCostChart data={currentData.providers} />
      </div>

      {/* 4. Dynamic Region Cost & Cost Comparison Charts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <RegionCostChart data={currentData.regions} />
        <CostComparisonChart
          data={currentData.comparison}
          dataKey={currentData.comparisonKey}
        />
      </div>

      {/* 5. Dynamic Cost Insights Section (Full Width) */}
      <CostInsights data={currentData.insights} />
    </div>
  );
}

export default Analytics;
