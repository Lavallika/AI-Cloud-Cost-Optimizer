import { Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function AIRecommendation({ recommendation = null }) {
  const impact = recommendation?.impact || "Medium";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
            <Lightbulb size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                AI Cost Recommendations
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                RandomForest ML
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500">
              Smart suggestions & ML cost predictions to optimize spending
            </p>
          </div>
        </div>

        <Link
          to="/ai-recommendations"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Try AI Predictor</span>
        </Link>
      </div>

      {recommendation ? (
        /* Recommendation Card */
        <div className="border border-slate-200/80 rounded-xl p-5 bg-slate-50/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {recommendation.service || "Cloud"}
                </span>
                {recommendation.region && (
                  <span className="text-xs text-slate-400">
                    {recommendation.region}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-base mt-1.5">
                {recommendation.recommendedConfig || recommendation.recommendedConfiguration || recommendation.title || "Resource Optimization"}
              </h3>

              <p className="text-sm text-slate-500 mt-0.5">
                {recommendation.reason || recommendation.description || "Optimization opportunity identified for this resource."}
              </p>
            </div>

            <span
              className={`self-start px-3 py-1 text-xs font-semibold rounded-full border shrink-0 ${
                impact === "High"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : impact === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200/60"
                  : "bg-blue-50 text-blue-700 border-blue-200/60"
              }`}
            >
              {impact} Impact
            </span>
          </div>

          {/* Current vs Recommended */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-center">
            <div className="bg-white rounded-lg p-4 border border-slate-200/80 min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Current Configuration
              </p>

              <p className="font-semibold text-slate-800 text-sm mt-1 truncate" title={recommendation.currentConfig || recommendation.resource}>
                {recommendation.currentConfig || recommendation.resource || "Standard"}
              </p>
            </div>

            <div className="flex items-center justify-center py-1 sm:py-0">
              <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ArrowRight className="rotate-90 sm:rotate-0" size={20} />
              </div>
            </div>

            <div className="bg-indigo-50/70 rounded-lg p-4 border border-indigo-100 min-w-0">
              <p className="text-xs font-medium text-indigo-600/80 uppercase tracking-wider">
                Recommended
              </p>

              <p className="font-semibold text-indigo-700 text-sm mt-1 truncate" title={recommendation.recommendedConfig || recommendation.recommendedConfiguration}>
                {recommendation.recommendedConfig || recommendation.recommendedConfiguration || "Right-sized"}
              </p>
            </div>
          </div>

          {/* Savings Footer */}
          <div className="flex flex-row items-center justify-between pt-4 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />

              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Estimated Monthly Savings
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-emerald-600">
                ₹{Number(recommendation.monthlySavings || 0).toLocaleString()}
              </span>
              {recommendation.savingsPercentage > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  {recommendation.savingsPercentage}%
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="border border-slate-200/80 rounded-xl p-8 bg-slate-50/40 flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">
            All cloud resources are currently optimized
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            No optimization recommendations available yet. Add resource utilization metrics to generate intelligent AI recommendations.
          </p>
        </div>
      )}
    </div>
  );
}

export default AIRecommendation;