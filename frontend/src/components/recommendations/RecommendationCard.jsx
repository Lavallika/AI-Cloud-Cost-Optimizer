import {
  ArrowRight,
  Eye,
  CheckCircle,
  HelpCircle,
  Cloud,
  Server,
  Cpu,
} from "lucide-react";

function RecommendationCard({ recommendation, onViewDetails, onMarkReviewed }) {
  const getProviderIcon = (provider) => {
    switch (provider) {
      case "AWS":
        return <Cloud size={18} className="text-amber-600" />;
      case "Azure":
        return <Server size={18} className="text-blue-600" />;
      case "GCP":
        return <Cpu size={18} className="text-emerald-600" />;
      default:
        return <Cloud size={18} className="text-indigo-600" />;
    }
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Low":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/60";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
            {getProviderIcon(recommendation.provider)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {recommendation.provider} • {recommendation.service}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Optimize {recommendation.resource}
            </h3>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shrink-0 ${getImpactBadge(recommendation.impact)}`}>
          {recommendation.impact} Impact
        </span>
      </div>

      {/* Resource ID & Region */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 font-mono">
        <span>ID: {recommendation.resourceId}</span>
        <span className="font-sans text-slate-600">{recommendation.region}</span>
      </div>

      {/* Current vs Recommended Configuration Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Current Config
          </p>
          <p className="font-semibold text-slate-800 text-sm mt-0.5">
            {recommendation.currentConfiguration}
          </p>
        </div>

        <div className="flex items-center justify-center py-1 sm:py-0">
          <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            <ArrowRight size={16} className="rotate-90 sm:rotate-0" />
          </div>
        </div>

        <div className="bg-indigo-50/70 rounded-lg p-3 border border-indigo-100">
          <p className="text-xs font-medium text-indigo-600/80 uppercase tracking-wider">
            Recommended
          </p>
          <p className="font-bold text-indigo-700 text-sm mt-0.5">
            {recommendation.recommendedConfiguration}
          </p>
        </div>
      </div>

      {/* Cost & Savings Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-400 font-medium">Current Cost</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">₹{recommendation.currentCost.toLocaleString()}/mo</p>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-400 font-medium">Est. Cost</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">₹{recommendation.estimatedCost.toLocaleString()}/mo</p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
          <p className="text-xs text-emerald-700 font-medium">Monthly Savings</p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">
            ₹{recommendation.monthlySavings.toLocaleString()} ({recommendation.savingsPercentage}%)
          </p>
        </div>
      </div>

      {/* Recommendation Reason */}
      <div className="flex items-start gap-2 p-3 bg-slate-50/80 rounded-lg border border-slate-100 text-xs text-slate-600">
        <HelpCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
        <p><strong className="text-slate-700">Why this recommendation?</strong> {recommendation.reason}</p>
      </div>

      {/* Footer Controls & Status */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Status Badge */}
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
            recommendation.status === "Reviewed"
              ? "bg-indigo-50 text-indigo-700 border-indigo-200/60"
              : recommendation.status === "Applied"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              : "bg-slate-100 text-slate-600 border-slate-200/60"
          }`}
        >
          {recommendation.status}
        </span>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(recommendation)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>

          {recommendation.status === "New" ? (
            <button
              onClick={() => onMarkReviewed(recommendation.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCircle size={14} />
              <span>Mark as Reviewed</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg">
              <CheckCircle size={14} />
              <span>Reviewed</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
