import { Flame, ArrowRight, Eye, CheckCircle2 } from "lucide-react";

function TopRecommendation({ recommendation, onViewDetails }) {
  if (!recommendation) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden space-y-4">
      {/* Background Subtle Pattern Overlay */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Top Opportunity
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {recommendation.savingsPercentage}% Savings
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Optimize {recommendation.resource} ({recommendation.resourceId})
            </h2>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(recommendation)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Eye size={15} />
          <span>View Recommendation</span>
        </button>
      </div>

      {/* Configuration & Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
        {/* Current Config */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Current Specs
          </p>
          <p className="text-base font-bold text-white">
            {recommendation.currentConfiguration}
          </p>
          <p className="text-xs text-slate-400">
            ₹{recommendation.currentCost.toLocaleString()} / mo
          </p>
        </div>

        {/* Transition Arrow */}
        <div className="flex items-center justify-center py-1 sm:py-0">
          <div className="p-2 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <ArrowRight size={20} className="rotate-90 sm:rotate-0" />
          </div>
        </div>

        {/* Recommended Config */}
        <div className="bg-indigo-950/80 rounded-xl p-4 border border-indigo-500/40 space-y-1">
          <p className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
            Recommended Specs
          </p>
          <p className="text-base font-bold text-indigo-200">
            {recommendation.recommendedConfiguration}
          </p>
          <p className="text-xs text-indigo-300">
            ₹{recommendation.estimatedCost.toLocaleString()} / mo
          </p>
        </div>
      </div>

      {/* Savings Summary Banner */}
      <div className="flex flex-row items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{recommendation.reason}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Monthly Savings</span>
          <span className="text-lg font-bold text-emerald-400">
            ₹{recommendation.monthlySavings.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TopRecommendation;
