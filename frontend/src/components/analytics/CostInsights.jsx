import { Lightbulb, TrendingUp, AlertTriangle, Info } from "lucide-react";

function CostInsights({ data = [] }) {
  const getInsightIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={18} className="text-amber-600 shrink-0" />;
      case "trending-up":
        return <TrendingUp size={18} className="text-rose-600 shrink-0" />;
      case "lightbulb":
        return <Lightbulb size={18} className="text-indigo-600 shrink-0" />;
      case "info":
      default:
        return <Info size={18} className="text-blue-600 shrink-0" />;
    }
  };

  const getInsightBadge = (type) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "trending-up":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      case "lightbulb":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "info":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/60";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
          <Lightbulb size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Cost Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Key observations and spending efficiency summary for selected period
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
        {data.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3 hover:bg-white hover:shadow-2xs transition-all"
          >
            <div className={`p-2 rounded-lg border ${getInsightBadge(item.type)} mt-0.5`}>
              {getInsightIcon(item.type)}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 text-sm">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CostInsights;
