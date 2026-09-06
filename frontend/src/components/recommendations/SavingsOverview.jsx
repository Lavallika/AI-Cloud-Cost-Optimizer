import { TrendingDown, Sparkles } from "lucide-react";

function SavingsOverview({ totalCurrent, totalOptimized, totalSavings }) {
  const savingsPercent = totalCurrent > 0 ? Math.round((totalSavings / totalCurrent) * 100) : 0;
  const optimizedPercent = 100 - savingsPercent;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Potential Savings Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Estimated infrastructure spending reduction after optimization
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold">
          <TrendingDown size={15} />
          <span>-{savingsPercent}% Reduction</span>
        </div>
      </div>

      {/* Figures Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-xs font-medium text-slate-500">Current Estimated Cost</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ₹{totalCurrent.toLocaleString()}
            <span className="text-xs text-slate-500 font-normal"> /mo</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
          <p className="text-xs font-medium text-indigo-700">Optimized Estimated Cost</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-700 tracking-tight">
            ₹{totalOptimized.toLocaleString()}
            <span className="text-xs text-indigo-600 font-normal"> /mo</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
          <p className="text-xs font-medium text-emerald-700">Potential Monthly Savings</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
            ₹{totalSavings.toLocaleString()}
            <span className="text-xs text-emerald-600 font-normal"> /mo</span>
          </p>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Optimized Share ({optimizedPercent}%)</span>
          <span className="text-emerald-600 font-semibold">Savings Potential ({savingsPercent}%)</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${optimizedPercent}%` }}
            title={`Optimized cost: ₹${totalOptimized}`}
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${savingsPercent}%` }}
            title={`Potential savings: ₹${totalSavings}`}
          />
        </div>
      </div>
    </div>
  );
}

export default SavingsOverview;
