import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Percent,
  RotateCcw,
  SearchX,
  RefreshCw,
  AlertCircle,
  Inbox,
  Loader2,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import SavingsOverview from "../components/recommendations/SavingsOverview";
import TopRecommendation from "../components/recommendations/TopRecommendation";
import RecommendationFilters from "../components/recommendations/RecommendationFilters";
import RecommendationCard from "../components/recommendations/RecommendationCard";
import RecommendationDetailsModal from "../components/recommendations/RecommendationDetailsModal";
import AICostPrediction from "../components/recommendations/AICostPrediction";
import { fetchRecommendations, updateRecommendationStatus } from "../services/costApi";

function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [providerFilter, setProviderFilter] = useState("All Providers");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [impactFilter, setImpactFilter] = useState("All Impact Levels");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Load recommendations dynamically from backend and ML engine
  const loadRecommendations = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchRecommendations();
      if (res.success && Array.isArray(res.data)) {
        setRecommendations(res.data);
        if (isManualRefresh) {
          toast.success(
            res.data.length > 0
              ? `Refreshed ${res.data.length} recommendations.`
              : "Recommendations checked — up to date."
          );
        }
      } else {
        const errorMsg = res.error || "Failed to load optimization recommendations.";
        setError(errorMsg);
        if (isManualRefresh) {
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = err.message || "An unexpected error occurred while loading recommendations.";
      setError(errorMsg);
      if (isManualRefresh) {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Scroll to AI Cost Prediction section and trigger a refresh
  const handleAnalyzeCosts = () => {
    const section = document.getElementById("ai-cost-prediction-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    loadRecommendations(true);
  };

  // Handle Mark as Reviewed status update
  const handleMarkReviewed = async (id) => {
    // Optimistic UI update
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: "Reviewed" } : rec))
    );
    toast.success("Recommendation marked as reviewed.");

    // Update selected modal recommendation if open
    if (selectedRecommendation && selectedRecommendation.id === id) {
      setSelectedRecommendation((prev) => ({ ...prev, status: "Reviewed" }));
    }

    // Persist status change to backend
    try {
      await updateRecommendationStatus(id, "Reviewed");
    } catch (err) {
      console.error(`Failed to persist reviewed status for recommendation ${id}:`, err);
    }
  };

  // Clear all active filters
  const handleClearFilters = () => {
    setProviderFilter("All Providers");
    setServiceFilter("All Services");
    setImpactFilter("All Impact Levels");
    setStatusFilter("All Statuses");
    setSearchQuery("");
  };

  // Dynamic calculations based on state
  const totalSavings = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + (rec.monthlySavings || 0), 0);
  }, [recommendations]);

  const totalCurrentCost = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + (rec.currentCost || 0), 0);
  }, [recommendations]);

  const totalEstimatedCost = useMemo(() => {
    return recommendations.reduce((sum, rec) => sum + (rec.estimatedCost || 0), 0);
  }, [recommendations]);

  const highImpactCount = useMemo(() => {
    return recommendations.filter((rec) => rec.impact === "High").length;
  }, [recommendations]);

  const avgSavingsPercent = useMemo(() => {
    if (recommendations.length === 0) return 0;
    const totalPercent = recommendations.reduce((sum, rec) => sum + (rec.savingsPercentage || 0), 0);
    return Math.round(totalPercent / recommendations.length);
  }, [recommendations]);

  // Top Recommendation with highest monthly savings
  const topRecommendation = useMemo(() => {
    if (recommendations.length === 0) return null;
    const sorted = [...recommendations].sort(
      (a, b) => (b.monthlySavings || 0) - (a.monthlySavings || 0)
    );
    return sorted[0] && sorted[0].monthlySavings > 0 ? sorted[0] : null;
  }, [recommendations]);

  // Filter recommendations dynamically
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      if (providerFilter !== "All Providers" && rec.provider !== providerFilter) {
        return false;
      }
      if (serviceFilter !== "All Services" && rec.service !== serviceFilter) {
        return false;
      }
      if (impactFilter !== "All Impact Levels" && rec.impact !== impactFilter) {
        return false;
      }
      if (statusFilter !== "All Statuses" && rec.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesProvider = rec.provider ? rec.provider.toLowerCase().includes(query) : false;
        const matchesService = rec.service ? rec.service.toLowerCase().includes(query) : false;
        const matchesResource = rec.resource ? rec.resource.toLowerCase().includes(query) : false;
        const matchesResourceId = rec.resourceId ? rec.resourceId.toLowerCase().includes(query) : false;
        const matchesRegion = rec.region ? rec.region.toLowerCase().includes(query) : false;
        if (
          !matchesProvider &&
          !matchesService &&
          !matchesResource &&
          !matchesResourceId &&
          !matchesRegion
        ) {
          return false;
        }
      }
      return true;
    });
  }, [recommendations, providerFilter, serviceFilter, impactFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI Cost Recommendations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered suggestions to reduce cloud spending and improve resource efficiency.
          </p>
        </div>

        <button
          onClick={handleAnalyzeCosts}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer shrink-0 self-start sm:self-auto disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          <span>{isRefreshing ? "Analyzing Costs..." : "Analyze Costs"}</span>
        </button>
      </div>

      {/* Error Banner if API Call Fails */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle size={20} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-rose-900">
              Unable to load recommendations
            </h3>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
          <div className="pt-1">
            <button
              onClick={() => loadRecommendations(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <StatCard
            title="Potential Monthly Savings"
            value={`₹${totalSavings.toLocaleString()}`}
            subtitle="Across all recommendations"
            icon={PiggyBank}
          />

          <StatCard
            title="Recommendations"
            value={recommendations.length.toString()}
            subtitle="Optimization opportunities"
            icon={CheckCircle2}
          />

          <StatCard
            title="High Impact"
            value={highImpactCount.toString()}
            subtitle="Priority recommendations"
            icon={AlertTriangle}
          />

          <StatCard
            title="Average Savings"
            value={`${avgSavingsPercent}%`}
            subtitle="Estimated optimization"
            icon={Percent}
          />
        </div>
      )}

      {/* 2. Potential Savings Overview */}
      <SavingsOverview
        totalCurrent={totalCurrentCost}
        totalOptimized={totalEstimatedCost}
        totalSavings={totalSavings}
      />

      {/* 3. AI Cost Prediction Feature (Random Forest ML Engine) */}
      <div id="ai-cost-prediction-section">
        <AICostPrediction />
      </div>

      {/* 4. Top Optimization Opportunity */}
      {topRecommendation && (
        <TopRecommendation
          recommendation={topRecommendation}
          onViewDetails={(rec) => setSelectedRecommendation(rec)}
        />
      )}

      {/* 5. Recommendation Filters */}
      <RecommendationFilters
        providerFilter={providerFilter}
        setProviderFilter={setProviderFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        impactFilter={impactFilter}
        setImpactFilter={setImpactFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* 6. Recommendation Cards Grid, Loading State, or Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/80 p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-100 rounded w-1/3" />
                <div className="h-5 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="h-12 bg-slate-100 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onViewDetails={(r) => setSelectedRecommendation(r)}
              onMarkReviewed={handleMarkReviewed}
            />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        /* Empty State: No records with utilization in DB */
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
            <Inbox size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              No optimization recommendations available
            </h3>
            <p className="text-sm text-slate-500">
              Add cloud cost records with utilization data to generate AI optimization recommendations.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => loadRecommendations(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-75"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Checking..." : "Check for Updates"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State: Active filters returned no matching results */
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 border border-slate-200/80 flex items-center justify-center mx-auto">
            <SearchX size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              No recommendations found
            </h3>
            <p className="text-sm text-slate-500">
              Try changing your filters or search terms to display optimization suggestions.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Details Modal Popup */}
      {selectedRecommendation && (
        <RecommendationDetailsModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onMarkReviewed={handleMarkReviewed}
        />
      )}
    </div>
  );
}

export default AIRecommendations;
