import { useState } from "react";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GitCompare } from "lucide-react";

function CostComparisonChart({ data = [], dataKey = "month" }) {
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPrevious, setShowPrevious] = useState(true);

  const toggleCurrent = () => {
    if (showCurrent && !showPrevious) {
      toast.error("At least one period line must remain visible.");
      return;
    }
    const nextState = !showCurrent;
    setShowCurrent(nextState);
    toast.info(nextState ? "Current Period line shown." : "Current Period line hidden.");
  };

  const togglePrevious = () => {
    if (showPrevious && !showCurrent) {
      toast.error("At least one period line must remain visible.");
      return;
    }
    const nextState = !showPrevious;
    setShowPrevious(nextState);
    toast.info(nextState ? "Previous Period line shown." : "Previous Period line hidden.");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      {/* Chart Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
            <GitCompare size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Current vs Previous Cost
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Period-over-period cloud spending comparison
            </p>
          </div>
        </div>

        {/* Interactive Period Toggle Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={toggleCurrent}
            aria-label="Toggle Current Period line"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showCurrent
                ? "bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs"
                : "bg-slate-100 text-slate-400 border-slate-200/60 opacity-60"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${showCurrent ? "bg-blue-600" : "bg-slate-400"}`} />
            <span>Current Period</span>
          </button>

          <button
            type="button"
            onClick={togglePrevious}
            aria-label="Toggle Previous Period line"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showPrevious
                ? "bg-slate-100 text-slate-700 border-slate-300/80 shadow-2xs"
                : "bg-slate-100 text-slate-400 border-slate-200/60 opacity-60"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${showPrevious ? "bg-slate-600" : "bg-slate-400"}`} />
            <span>Previous Period</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey={dataKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
            />
            <Tooltip
              formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
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
            
            {showCurrent && (
              <Line
                type="monotone"
                name="Current Period"
                dataKey="current"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#2563eb" }}
              />
            )}
            
            {showPrevious && (
              <Line
                type="monotone"
                name="Previous Period"
                dataKey="previous"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#94a3b8" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CostComparisonChart;
