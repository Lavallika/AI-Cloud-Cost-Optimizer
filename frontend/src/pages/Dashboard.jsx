import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  Cloud,
  Calendar,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import CostChart from "../components/dashboard/CostChart";
import ServiceCostBreakdown from "../components/dashboard/ServiceCostBreakdown";
import AIRecommendation from "../components/dashboard/AIRecommendation";
import RecentCostActivity from "../components/dashboard/RecentCostActivity";
import QuickActions from "../components/dashboard/QuickActions";

function Dashboard() {
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

      {/* 1. Four Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Cloud Cost"
          value="₹45,280"
          subtitle="This month"
          icon={DollarSign}
        />

        <StatCard
          title="Monthly Cost"
          value="₹12,450"
          subtitle="Current month"
          icon={TrendingUp}
        />

        <StatCard
          title="Potential Savings"
          value="₹8,620"
          subtitle="AI estimated"
          icon={PiggyBank}
        />

        <StatCard
          title="Active Resources"
          value="24"
          subtitle="Active cloud resources"
          icon={Cloud}
        />
      </div>

      {/* 2. Visual Cost Overview: Line Chart & Service Cost Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2">
          <CostChart />
        </div>
        <div className="lg:col-span-1">
          <ServiceCostBreakdown />
        </div>
      </div>

      {/* 3. AI Cost Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <AIRecommendation />
        <RecentCostActivity />
      </div>

      {/* 4. Quick Navigation Actions */}
      <QuickActions />

    </div>
  );
}

export default Dashboard;