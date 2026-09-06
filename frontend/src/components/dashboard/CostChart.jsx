import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const costData = [
  { month: "Jan", cost: 8200 },
  { month: "Feb", cost: 9500 },
  { month: "Mar", cost: 11000 },
  { month: "Apr", cost: 9800 },
  { month: "May", cost: 12450 },
  { month: "Jun", cost: 13800 },
];

function CostChart() {
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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            
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
              tickFormatter={(val) => `₹${val / 1000}k`}
            />

            <Tooltip
              formatter={(value) => [`₹${value.toLocaleString()}`, "Cost"]}
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
      </div>

    </div>
  );
}

export default CostChart;