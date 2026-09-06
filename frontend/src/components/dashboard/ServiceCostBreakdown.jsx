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

const serviceData = [
  { name: "EC2", cost: 5200, color: "#2563eb" },
  { name: "RDS", cost: 3450, color: "#4f46e5" },
  { name: "S3", cost: 2100, color: "#0284c7" },
  { name: "Lambda", cost: 1200, color: "#0d9488" },
  { name: "Other", cost: 500, color: "#64748b" },
];

function ServiceCostBreakdown() {
  const totalCost = serviceData.reduce((sum, item) => sum + item.cost, 0);

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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={serviceData}
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
                width={55}
              />
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
              <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={18}>
                {serviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Breakdown Summary Pills */}
      <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {serviceData.map((item) => {
          const percentage = ((item.cost / totalCost) * 100).toFixed(0);
          return (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-700">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900">₹{item.cost.toLocaleString()} ({percentage}%)</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default ServiceCostBreakdown;
