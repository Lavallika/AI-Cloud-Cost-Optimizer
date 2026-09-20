import { Activity, Clock } from "lucide-react";

function formatActivityDate(dateString) {
  if (!dateString) return "Recently recorded";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours >= 0 && diffHours < 1) return "Just now";
    if (diffHours >= 1 && diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return String(dateString);
  }
}

function RecentCostActivity({ activities = [] }) {
  const hasActivities = Array.isArray(activities) && activities.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
      
      {/* Component Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Recent Cost Activity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Latest cloud resource usage & spending updates
          </p>
        </div>
      </div>

      {/* Activity List */}
      {hasActivities ? (
        <div className="divide-y divide-slate-100">
          {activities.slice(0, 3).map((item) => {
            const resourceName = item.resource_name || item.resource || item.service || "Cloud Resource";
            const cost = parseFloat(item.current_monthly_cost || item.currentCost || 0);
            const dateLabel = formatActivityDate(item.billing_date || item.created_at);

            return (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 shrink-0">
                    {item.service || "Cloud"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate" title={resourceName}>
                      {resourceName} cost recorded
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Clock size={12} />
                      <span>{dateLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-slate-900">
                    ₹{cost.toLocaleString()}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-2">
            <Activity size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            No recent cloud cost activity
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Recent cloud spending updates will appear here once cost records are created.
          </p>
        </div>
      )}

    </div>
  );
}

export default RecentCostActivity;
