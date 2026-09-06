import { Search, RotateCcw, Filter } from "lucide-react";

function CloudCostFilters({
  providerFilter,
  setProviderFilter,
  serviceFilter,
  setServiceFilter,
  regionFilter,
  setRegionFilter,
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
    "ElastiCache",
    "Blob Storage",
    "Cloud Storage",
    "SQL Database",
  ];

  const regions = [
    "All Regions",
    "US East (N. Virginia)",
    "Asia Pacific (Mumbai)",
    "Central India",
    "Mumbai",
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Filter size={16} className="text-indigo-600" />
          <span>Filter Cloud Costs</span>
        </div>

        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Clear Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Provider Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Cloud Provider
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

        {/* Service Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Cloud Service
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

        {/* Region Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Region
          </label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
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
              placeholder="Search services or regions..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudCostFilters;
