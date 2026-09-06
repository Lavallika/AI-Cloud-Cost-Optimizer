import { X, Cloud, Server, Cpu, TrendingUp, TrendingDown, Info } from "lucide-react";

function CostDetailsModal({ record, onClose }) {
  if (!record) return null;

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              {getProviderIcon(record.provider)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {record.provider}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/70 font-medium text-slate-700">
                  {record.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {record.service} Details
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
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Region</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{record.region}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Resource Usage</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{record.usage}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Current Cost</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">₹{record.currentCost.toLocaleString()}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-400">Previous Cost</p>
              <p className="text-base font-semibold text-slate-600 mt-0.5">₹{record.previousCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Trend Details */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <span className="text-xs font-medium text-slate-600">Month-over-Month Trend</span>
            {record.trend > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                <TrendingUp size={14} />
                +{record.trend}% Cost Surge
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <TrendingDown size={14} />
                {record.trend}% Cost Reduction
              </span>
            )}
          </div>

          {/* Description / Notes */}
          {record.details && (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <Info size={14} />
                <span>Resource Specification</span>
              </div>
              <p className="text-slate-600 leading-relaxed pt-0.5">{record.details}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

export default CostDetailsModal;
