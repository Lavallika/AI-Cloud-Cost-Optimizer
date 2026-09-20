import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

function CostChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Monthly Cloud Cost
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cloud spending trend for the last 6 months
          </p>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 12 }} 
                dy={10}
              />

              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 12 }} 
                tickFormatter={(val) => {
                  if (val === 0) return "₹0";
                  if (val >= 1000) {
                    const formatted = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1);
                    return `₹${formatted}k`;
                  }
                  return `₹${val}`;
                }}
              />

              <Tooltip
                formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, "Cost"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                  fontSize: "13px",
                  color: "#0f172a",
                  padding: "8px 12px",
                }}
                labelStyle={{ fontWeight: "600", color: "#0f172a", marginBottom: "4px" }}
              />

              <Line
                type="monotone"
                dataKey="cost"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
              />

            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
            <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
              <TrendingUp size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No cost trend data available
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Add cloud cost records with billing dates to visualize your monthly spending trend.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default CostChart;