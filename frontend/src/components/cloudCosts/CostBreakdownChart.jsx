import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";

function CostBreakdownChart({ data }) {
  // Aggregate cost by service from filtered data
  const serviceMap = {};
  data.forEach((item) => {
    serviceMap[item.service] = (serviceMap[item.service] || 0) + item.currentCost;
  });

  const chartData = Object.keys(serviceMap).map((serviceName, index) => {
    const colors = ["#2563eb", "#4f46e5", "#0284c7", "#0d9488", "#d97706", "#dc2626", "#64748b"];
    return {
      service: serviceName,
      cost: serviceMap[serviceName],
      fill: colors[index % colors.length],
    };
  }).sort((a, b) => b.cost - a.cost);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
          <BarChart2 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Cost Breakdown by Service
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Total spending breakdown calculated from filtered cloud records
          </p>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="service"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#0f172a", fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(val) => `₹${val / 1000}k`}
            />
            <Tooltip
              formatter={(value) => [`₹${value.toLocaleString()}`, "Current Cost"]}
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
            <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={28}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CostBreakdownChart;
