import { Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function AIRecommendation() {
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

      {/* Recommendation Card */}
      <div className="border border-slate-200/80 rounded-xl p-5 bg-slate-50/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              Optimize EC2 Instance
            </h3>

            <p className="text-sm text-slate-500 mt-0.5">
              Your EC2 instance appears to be underutilized.
            </p>
          </div>

          <span className="self-start px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            High Impact
          </span>
        </div>

        {/* Current vs Recommended */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-center">
          <div className="bg-white rounded-lg p-4 border border-slate-200/80">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Current Instance
            </p>

            <p className="font-bold text-slate-800 text-base mt-1">
              t3.large
            </p>
          </div>

          <div className="flex items-center justify-center py-1 sm:py-0">
            <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ArrowRight className="rotate-90 sm:rotate-0" size={20} />
            </div>
          </div>

          <div className="bg-indigo-50/70 rounded-lg p-4 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-600/80 uppercase tracking-wider">
              Recommended
            </p>

            <p className="font-bold text-indigo-700 text-base mt-1">
              t3.medium
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

          <span className="text-base sm:text-lg font-bold text-emerald-600">
            ₹2,450
          </span>
        </div>
      </div>
    </div>
  );
}

export default AIRecommendation;