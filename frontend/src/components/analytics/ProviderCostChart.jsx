import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Cloud } from "lucide-react";

function ProviderCostChart({ data = [] }) {
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
          <Cloud size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Cost by Cloud Provider
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Share of cloud spending across infrastructure providers
          </p>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="cost"
              nameKey="provider"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`₹${value.toLocaleString()}`, "Cost"]}
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
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => {
                const item = data.find((p) => p.provider === value);
                if (!item) return value;
                const percentage = totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0;
                return (
                  <span className="text-xs font-semibold text-slate-700 ml-1">
                    {value}: ₹{item.cost.toLocaleString()} ({percentage}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProviderCostChart;
