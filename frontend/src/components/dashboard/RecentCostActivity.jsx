import { Activity, Clock } from "lucide-react";

const recentActivities = [
  {
    id: 1,
    activity: "EC2 usage increased",
    service: "EC2",
    cost: "₹1,250",
    date: "2 hours ago",
    type: "increase",
  },
  {
    id: 2,
    activity: "S3 storage cost updated",
    service: "S3",
    cost: "₹680",
    date: "5 hours ago",
    type: "update",
  },
  {
    id: 3,
    activity: "RDS usage detected",
    service: "RDS",
    cost: "₹1,420",
    date: "1 day ago",
    type: "usage",
  },
];

function RecentCostActivity() {
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
      <div className="divide-y divide-slate-100">
        {recentActivities.map((item) => (
          <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                {item.service}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.activity}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <Clock size={12} />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-slate-900">
                {item.cost}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default RecentCostActivity;
