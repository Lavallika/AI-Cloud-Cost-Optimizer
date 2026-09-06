import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, DollarSign, Cloud, Flame, PiggyBank, SearchX, RotateCcw } from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import CloudCostFilters from "../components/cloudCosts/CloudCostFilters";
import CloudCostTable from "../components/cloudCosts/CloudCostTable";
import CostBreakdownChart from "../components/cloudCosts/CostBreakdownChart";
import CostDetailsModal from "../components/cloudCosts/CostDetailsModal";
import AddCostModal from "../components/cloudCosts/AddCostModal";
import { fetchCostRecords, createCostRecord, deleteCostRecord } from "../services/costApi";

function CloudCosts() {
  // Cost records fetched from PostgreSQL
  const [costRecords, setCostRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [providerFilter, setProviderFilter] = useState("All Providers");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load records from PostgreSQL database
  const loadCostRecords = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchCostRecords();
    if (res.success) {
      setCostRecords(res.data);
    } else {
      toast.error(res.error || "Failed to load cloud cost records.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCostRecords();
  }, [loadCostRecords]);

  // Handle new record submission from modal to PostgreSQL
  const handleAddCost = async (newRecordData) => {
    const res = await createCostRecord(newRecordData);
    if (res.success) {
      toast.success(res.message || "Cost record created successfully.");
      setIsAddModalOpen(false);
      loadCostRecords();
    } else {
      toast.error(res.error || "Failed to add cost record.");
    }
  };

  // Handle deleting a record from PostgreSQL
  const handleDeleteCost = async (id) => {
    const res = await deleteCostRecord(id);
    if (res.success) {
      toast.success(res.message || "Cost record deleted successfully.");
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(null);
      }
      loadCostRecords();
    } else {
      toast.error(res.error || "Failed to delete cost record.");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setProviderFilter("All Providers");
    setServiceFilter("All Services");
    setRegionFilter("All Regions");
    setSearchQuery("");
  };

  // Filter dataset dynamically
  const filteredRecords = useMemo(() => {
    return costRecords.filter((record) => {
      if (providerFilter !== "All Providers" && record.provider !== providerFilter) return false;
      if (serviceFilter !== "All Services" && record.service !== serviceFilter) return false;
      if (regionFilter !== "All Regions" && record.region !== regionFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesProvider = (record.provider || "").toLowerCase().includes(query);
        const matchesService = (record.service || "").toLowerCase().includes(query);
        const matchesRegion = (record.region || "").toLowerCase().includes(query);
        const matchesResource = (record.resource || record.resource_name || "").toLowerCase().includes(query);
        if (!matchesProvider && !matchesService && !matchesRegion && !matchesResource) return false;
      }
      return true;
    });
  }, [costRecords, providerFilter, serviceFilter, regionFilter, searchQuery]);

  // --- Dynamic Summary Card Calculations ---

  // Total Cloud Cost: sum of all currentCost across all records
  const totalCost = useMemo(() => {
    return costRecords.reduce((sum, r) => sum + (Number(r.currentCost) || 0), 0);
  }, [costRecords]);

  // AWS Cost: sum of currentCost for AWS records
  const awsCost = useMemo(() => {
    return costRecords
      .filter((r) => r.provider === "AWS")
      .reduce((sum, r) => sum + (Number(r.currentCost) || 0), 0);
  }, [costRecords]);

  // Highest Cost Service: service name with the largest total currentCost
  const highestCostService = useMemo(() => {
    const serviceTotals = {};
    costRecords.forEach((r) => {
      const cost = Number(r.currentCost) || 0;
      serviceTotals[r.service] = (serviceTotals[r.service] || 0) + cost;
    });
    const topService = Object.entries(serviceTotals).sort((a, b) => b[1] - a[1])[0];
    return topService ? { name: topService[0], cost: topService[1] } : { name: "—", cost: 0 };
  }, [costRecords]);

  // Potential Savings: sum of positive cost reductions (current < previous)
  const potentialSavings = useMemo(() => {
    return costRecords.reduce((sum, r) => {
      const current = Number(r.currentCost) || 0;
      const prev = r.previousCost !== undefined && r.previousCost !== null ? Number(r.previousCost) : current;
      const diff = prev - current;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }, [costRecords]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cloud Costs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and analyze your cloud spending across services and regions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Add Cost Record</span>
        </button>
      </div>

      {/* Summary Cards — dynamically calculated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Cloud Cost"
          value={`₹${totalCost.toLocaleString()}`}
          subtitle="Current billing period"
          icon={DollarSign}
        />

        <StatCard
          title="AWS Cost"
          value={`₹${awsCost.toLocaleString()}`}
          subtitle="Current billing period"
          icon={Cloud}
        />

        <StatCard
          title="Highest Cost Service"
          value={highestCostService.name}
          subtitle={`₹${highestCostService.cost.toLocaleString()}`}
          icon={Flame}
        />

        <StatCard
          title="Potential Savings"
          value={`₹${potentialSavings.toLocaleString()}`}
          subtitle="Based on cost reduction"
          icon={PiggyBank}
        />
      </div>

      {/* Filter Section */}
      <CloudCostFilters
        providerFilter={providerFilter}
        setProviderFilter={setProviderFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Cost Table or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-500 text-sm">
          Loading cloud cost records from PostgreSQL...
        </div>
      ) : filteredRecords.length > 0 ? (
        <CloudCostTable
          data={filteredRecords}
          onViewDetails={(record) => setSelectedRecord(record)}
          onDelete={handleDeleteCost}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 border border-slate-200/80 flex items-center justify-center mx-auto">
            <SearchX size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              No cloud cost records found
            </h3>
            <p className="text-sm text-slate-500">
              Try changing your filters, adding a new record, or clearing filters.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Cost Breakdown Chart */}
      {!isLoading && filteredRecords.length > 0 && (
        <CostBreakdownChart data={filteredRecords} />
      )}

      {/* Detail Modal Inspection */}
      {selectedRecord && (
        <CostDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Add Cost Record Modal */}
      <AddCostModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCost}
      />
    </div>
  );
}

export default CloudCosts;
