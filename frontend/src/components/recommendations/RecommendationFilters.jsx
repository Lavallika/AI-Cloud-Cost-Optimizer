import { Search, RotateCcw, Filter } from "lucide-react";

function RecommendationFilters({
  providerFilter,
  setProviderFilter,
  serviceFilter,
  setServiceFilter,
  impactFilter,
  setImpactFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onClearFilters,
}) {
  const providers = ["All Providers", "AWS", "Azure", "GCP"];
  const services = [
    "All Services",
    "EC2",
    "S3",
    "RDS",
    "Lambda",
    "Virtual Machines",
    "Compute Engine",
  ];
  const impacts = ["All Impact Levels", "High", "Medium", "Low"];
  const statuses = ["All Statuses", "New", "Reviewed", "Applied"];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Filter size={16} className="text-indigo-600" />
          <span>Filter AI Recommendations</span>
        </div>

        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Clear Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Provider */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Provider
          </label>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Service
          </label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Impact */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Impact Level
          </label>
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {impacts.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recommendations..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendationFilters;
