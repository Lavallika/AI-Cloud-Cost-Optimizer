import { Eye, Trash2, TrendingUp, TrendingDown, Cloud, Server, Cpu } from "lucide-react";

function CloudCostTable({ data, onViewDetails, onDelete }) {
  const getProviderBadge = (provider) => {
    switch (provider) {
      case "AWS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold text-xs">
            <Cloud size={13} className="text-amber-600" />
            <span>AWS</span>
          </span>
        );
      case "Azure":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold text-xs">
            <Server size={13} className="text-blue-600" />
            <span>Azure</span>
          </span>
        );
      case "GCP":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold text-xs">
            <Cpu size={13} className="text-emerald-600" />
            <span>GCP</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
            {provider}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "High":
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-medium text-xs">
            High Cost
          </span>
        );
      case "Optimized":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium text-xs">
            Optimized
          </span>
        );
      case "Normal":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-medium text-xs">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Provider</th>
              <th className="py-3.5 px-4 sm:px-6">Service</th>
              <th className="py-3.5 px-4 sm:px-6">Region</th>
              <th className="py-3.5 px-4 sm:px-6">Usage</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Current Cost</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Previous</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">Trend</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
              <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-slate-50/60 transition-colors duration-150"
              >
                {/* Provider */}
                <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                  {getProviderBadge(row.provider)}
                </td>

                {/* Service */}
                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 whitespace-nowrap">
                  {row.service}
                </td>

                {/* Region */}
                <td className="py-3.5 px-4 sm:px-6 text-slate-600 whitespace-nowrap text-xs">
                  {row.region}
                </td>

                {/* Usage */}
                <td className="py-3.5 px-4 sm:px-6 text-slate-600 whitespace-nowrap text-xs font-mono">
                  {row.usage}
                </td>

                {/* Current Cost */}
                <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 text-right whitespace-nowrap">
                  ₹{Number(row.currentCost).toLocaleString()}
                </td>

                {/* Previous Cost */}
                <td className="py-3.5 px-4 sm:px-6 text-slate-500 text-right whitespace-nowrap text-xs">
                  ₹{Number(row.previousCost).toLocaleString()}
                </td>

                {/* Trend */}
                <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                  {row.trend > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      <TrendingUp size={13} />
                      +{row.trend}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      <TrendingDown size={13} />
                      {row.trend}%
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                  {getStatusBadge(row.status)}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onViewDetails(row)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="View details"
                      aria-label={`View details for ${row.service}`}
                    >
                      <Eye size={18} />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete record"
                        aria-label={`Delete record for ${row.service}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CloudCostTable;
