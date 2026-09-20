import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Server } from "lucide-react";

const DEFAULT_COLORS = ["#2563eb", "#4f46e5", "#0284c7", "#0d9488", "#d97706", "#dc2626", "#64748b"];

function ServiceCostBreakdown({ data = [] }) {
  const normalizedData = (Array.isArray(data) ? data : []).map((item, index) => ({
    name: item.name || item.service || "Other",
    cost: Number(item.cost || item.value || 0),
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const totalCost = normalizedData.reduce((sum, item) => sum + item.cost, 0);
  const hasData = normalizedData.length > 0 && totalCost > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Cost by Service
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Spending distribution across cloud resources
              </p>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full h-56 sm:h-64 my-2">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={normalizedData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "#0f172a", fontSize: 12, fontWeight: 500 }}
                  width={65}
                />
                <Tooltip
                  formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, "Cost"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "13px",
                    color: "#0f172a",
                    padding: "8px 12px",
                  }}
                />
                <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={18}>
                  {normalizedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
              <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
                <Server size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No service cost data
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Cost distribution across cloud services will appear here once records are added.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Service Breakdown Summary Pills */}
      {hasData && (
        <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {normalizedData.map((item) => {
            const percentage = totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 shrink-0 ml-1">
                  ₹{item.cost.toLocaleString()} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default ServiceCostBreakdown;
