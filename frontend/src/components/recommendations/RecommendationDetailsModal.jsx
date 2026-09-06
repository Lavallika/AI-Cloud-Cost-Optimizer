import { X, ArrowRight, CheckCircle, Sparkles, Cloud, Server, Cpu } from "lucide-react";

function RecommendationDetailsModal({ recommendation, onClose, onMarkReviewed }) {
  if (!recommendation) return null;

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "AWS":
        return <Cloud className="text-amber-500" size={24} />;
      case "Azure":
        return <Server className="text-blue-500" size={24} />;
      case "GCP":
        return <Cpu className="text-emerald-500" size={24} />;
      default:
        return <Cloud className="text-indigo-500" size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 space-y-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              {getProviderIcon(recommendation.provider)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {recommendation.provider} • {recommendation.service}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                  {recommendation.impact} Impact
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Recommendation Details
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-slate-400 font-medium">Resource</p>
              <p className="font-semibold text-slate-800 mt-0.5">{recommendation.resource}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Resource ID</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">{recommendation.resourceId}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Region</p>
              <p className="font-semibold text-slate-800 mt-0.5">{recommendation.region}</p>
            </div>
          </div>

          {/* Configuration Comparison */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Specification Transformation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/80">
                <p className="text-xs text-slate-400 font-medium">Current Configuration</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{recommendation.currentConfiguration}</p>
              </div>

              <div className="flex items-center justify-center py-1 sm:py-0">
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <ArrowRight size={18} className="rotate-90 sm:rotate-0" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-600/80 font-medium">Recommended Configuration</p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{recommendation.recommendedConfiguration}</p>
              </div>
            </div>
          </div>

          {/* Cost Figures Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Current Cost</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">₹{recommendation.currentCost.toLocaleString()}/mo</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Estimated Cost</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">₹{recommendation.estimatedCost.toLocaleString()}/mo</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
              <p className="text-xs font-medium text-emerald-700">Monthly Savings</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{recommendation.monthlySavings.toLocaleString()}/mo</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
              <p className="text-xs font-medium text-emerald-700">Savings Rate</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{recommendation.savingsPercentage}%</p>
            </div>
          </div>

          {/* Recommendation Reason */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <Sparkles size={15} />
              <span>Reason for Recommendation</span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-0.5">{recommendation.reason}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Status: <span className="text-slate-800 font-semibold">{recommendation.status}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>

            {recommendation.status === "New" && (
              <button
                onClick={() => {
                  onMarkReviewed(recommendation.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>Mark as Reviewed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendationDetailsModal;
