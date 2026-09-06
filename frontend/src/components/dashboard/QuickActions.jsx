import { Link } from "react-router-dom";
import { Cloud, BarChart3, Lightbulb, ArrowRight, Zap } from "lucide-react";

function QuickActions() {
  const actions = [
    {
      title: "View Cloud Costs",
      description: "Explore resource spending details",
      to: "/cloud-costs",
      icon: Cloud,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "View Analytics",
      description: "Analyze cost & usage trends",
      to: "/analytics",
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      title: "View AI Recommendations",
      description: "Discover cost optimization rules",
      to: "/ai-recommendations",
      icon: Lightbulb,
      color: "bg-amber-50 text-amber-600 border-amber-200/60",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Quick Actions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Fast access to cloud optimization modules
          </p>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg border ${action.color}`}>
                  <Icon size={20} />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}

export default QuickActions;
