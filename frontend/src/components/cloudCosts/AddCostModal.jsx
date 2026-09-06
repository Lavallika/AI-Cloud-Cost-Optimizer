import { useState, useEffect, useCallback } from "react";
import { X, Plus, Activity } from "lucide-react";

const PROVIDERS = ["AWS", "Azure", "GCP"];
const SERVICES = ["EC2", "S3", "RDS", "Lambda", "Virtual Machines", "Compute Engine"];
const REGIONS = [
  "US East (N. Virginia)",
  "US West (Oregon)",
  "Asia Pacific (Mumbai)",
  "Central India",
  "Europe (Frankfurt)",
  "Asia Pacific (Singapore)",
];

const getTodayDate = () => new Date().toISOString().split("T")[0];

const INITIAL_FORM = {
  provider: "",
  service: "",
  region: "",
  resource: "",
  usage: "",
  currentCost: "",
  previousCost: "",
  billingDate: getTodayDate(),
  cpuUtilization: "",
  memoryUtilization: "",
  storageUtilization: "",
  requestCount: "",
  dataTransferGb: "",
};

function AddCostModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ ...INITIAL_FORM, billingDate: getTodayDate() });
      setErrors({});
    }
  }, [isOpen]);

  // Close modal on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for that field on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.provider) newErrors.provider = "Cloud provider is required.";
    if (!form.service) newErrors.service = "Cloud service is required.";
    if (!form.region) newErrors.region = "Region is required.";
    if (!form.resource.trim()) newErrors.resource = "Resource name is required.";
    if (!form.billingDate) newErrors.billingDate = "Billing date is required.";

    const usage = Number(form.usage);
    if (!form.usage) {
      newErrors.usage = "Usage is required.";
    } else if (isNaN(usage) || usage <= 0) {
      newErrors.usage = "Usage must be a positive number.";
    }

    const currentCost = Number(form.currentCost);
    if (!form.currentCost) {
      newErrors.currentCost = "Monthly cost is required.";
    } else if (isNaN(currentCost) || currentCost <= 0) {
      newErrors.currentCost = "Monthly cost must be a positive number.";
    }

    if (form.previousCost !== "") {
      const prevCost = Number(form.previousCost);
      if (isNaN(prevCost) || prevCost < 0) {
        newErrors.previousCost = "Previous cost must be a non-negative number.";
      }
    }

    // Utilization & metric validations (all optional)
    if (form.cpuUtilization !== "") {
      const cpu = Number(form.cpuUtilization);
      if (isNaN(cpu) || cpu < 0 || cpu > 100) {
        newErrors.cpuUtilization = "CPU utilization must be between 0 and 100%.";
      }
    }

    if (form.memoryUtilization !== "") {
      const mem = Number(form.memoryUtilization);
      if (isNaN(mem) || mem < 0 || mem > 100) {
        newErrors.memoryUtilization = "Memory utilization must be between 0 and 100%.";
      }
    }

    if (form.storageUtilization !== "") {
      const storage = Number(form.storageUtilization);
      if (isNaN(storage) || storage < 0 || storage > 100) {
        newErrors.storageUtilization = "Storage utilization must be between 0 and 100%.";
      }
    }

    if (form.requestCount !== "") {
      const reqCount = Number(form.requestCount);
      if (isNaN(reqCount) || reqCount < 0) {
        newErrors.requestCount = "Request count must be a non-negative number.";
      }
    }

    if (form.dataTransferGb !== "") {
      const transfer = Number(form.dataTransferGb);
      if (isNaN(transfer) || transfer < 0) {
        newErrors.dataTransferGb = "Data transfer must be a non-negative number.";
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const currentCost = Number(form.currentCost);
    const previousCost = form.previousCost !== "" ? Number(form.previousCost) : currentCost;

    // Calculate trend percentage
    let trend = 0;
    if (previousCost > 0) {
      trend = parseFloat(
        (((currentCost - previousCost) / previousCost) * 100).toFixed(1)
      );
    }

    // Determine status based on trend
    let status = "Normal";
    if (trend > 5) status = "High";
    else if (trend < 0) status = "Optimized";

    const cpuVal = form.cpuUtilization !== "" ? Number(form.cpuUtilization) : null;
    const memVal = form.memoryUtilization !== "" ? Number(form.memoryUtilization) : null;
    const storageVal = form.storageUtilization !== "" ? Number(form.storageUtilization) : null;
    const reqCountVal = form.requestCount !== "" ? Number(form.requestCount) : null;
    const transferVal = form.dataTransferGb !== "" ? Number(form.dataTransferGb) : null;

    const newRecord = {
      id: Date.now(),
      provider: form.provider,
      service: form.service,
      region: form.region,
      resource: form.resource.trim(),
      resource_name: form.resource.trim(),
      usage: `${form.usage} Units`,
      usage_hours: Number(form.usage),
      currentCost,
      current_monthly_cost: currentCost,
      previousCost,
      previous_monthly_cost: previousCost,
      cpuUtilization: cpuVal,
      cpu_utilization: cpuVal,
      memoryUtilization: memVal,
      memory_utilization: memVal,
      storageUtilization: storageVal,
      storage_utilization: storageVal,
      requestCount: reqCountVal,
      request_count: reqCountVal,
      dataTransferGb: transferVal,
      data_transfer_gb: transferVal,
      trend,
      status,
      details: `${form.resource.trim()} — added on ${form.billingDate}.`,
      billingDate: form.billingDate,
      billing_date: form.billingDate,
    };

    onAdd(newRecord);
  };

  const handleOverlayClick = (e) => {
    // Only close when clicking the dark backdrop directly
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Add Cloud Cost Record
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new cloud resource cost entry with utilization metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 sm:p-6 space-y-5">
            {/* Row 1: Provider + Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cloud Provider */}
              <div>
                <label
                  htmlFor="add-provider"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Cloud Provider <span className="text-rose-500">*</span>
                </label>
                <select
                  id="add-provider"
                  name="provider"
                  value={form.provider}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.provider ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                >
                  <option value="">Select provider</option>
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.provider && (
                  <p className="mt-1 text-xs text-rose-600">{errors.provider}</p>
                )}
              </div>

              {/* Cloud Service */}
              <div>
                <label
                  htmlFor="add-service"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Cloud Service <span className="text-rose-500">*</span>
                </label>
                <select
                  id="add-service"
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.service ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                >
                  <option value="">Select service</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.service && (
                  <p className="mt-1 text-xs text-rose-600">{errors.service}</p>
                )}
              </div>
            </div>

            {/* Row 2: Region + Resource Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Region */}
              <div>
                <label
                  htmlFor="add-region"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Region <span className="text-rose-500">*</span>
                </label>
                <select
                  id="add-region"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.region ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.region && (
                  <p className="mt-1 text-xs text-rose-600">{errors.region}</p>
                )}
              </div>

              {/* Resource Name */}
              <div>
                <label
                  htmlFor="add-resource"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Resource Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-resource"
                  type="text"
                  name="resource"
                  value={form.resource}
                  onChange={handleChange}
                  placeholder="e.g. Production EC2 Instance"
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.resource ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.resource && (
                  <p className="mt-1 text-xs text-rose-600">{errors.resource}</p>
                )}
              </div>
            </div>

            {/* Row 3: Usage + Billing Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Usage */}
              <div>
                <label
                  htmlFor="add-usage"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Usage (Hours/Units) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-usage"
                  type="number"
                  name="usage"
                  value={form.usage}
                  onChange={handleChange}
                  placeholder="e.g. 720"
                  min="0"
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.usage ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.usage && (
                  <p className="mt-1 text-xs text-rose-600">{errors.usage}</p>
                )}
              </div>

              {/* Billing Date */}
              <div>
                <label
                  htmlFor="add-billingDate"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Billing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-billingDate"
                  type="date"
                  name="billingDate"
                  value={form.billingDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.billingDate ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.billingDate && (
                  <p className="mt-1 text-xs text-rose-600">{errors.billingDate}</p>
                )}
              </div>
            </div>

            {/* Row 4: Current Cost + Previous Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Monthly Cost */}
              <div>
                <label
                  htmlFor="add-currentCost"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Current Monthly Cost (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="add-currentCost"
                  type="number"
                  name="currentCost"
                  value={form.currentCost}
                  onChange={handleChange}
                  placeholder="e.g. 2450"
                  min="0"
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.currentCost ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.currentCost && (
                  <p className="mt-1 text-xs text-rose-600">{errors.currentCost}</p>
                )}
              </div>

              {/* Previous Monthly Cost */}
              <div>
                <label
                  htmlFor="add-previousCost"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Previous Monthly Cost (₹){" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="add-previousCost"
                  type="number"
                  name="previousCost"
                  value={form.previousCost}
                  onChange={handleChange}
                  placeholder="e.g. 2800"
                  min="0"
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.previousCost ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.previousCost && (
                  <p className="mt-1 text-xs text-rose-600">{errors.previousCost}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Used to calculate cost trend.
                </p>
              </div>
            </div>

            {/* Row 5: Resource Utilization & Operational Metrics (Optional, for AI ML Optimization) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <Activity size={15} />
                <span>Resource Utilization & Operational Metrics</span>
                <span className="text-slate-400 font-normal ml-1">(Optional - Used for AI Optimization)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CPU Utilization */}
                <div>
                  <label
                    htmlFor="add-cpuUtilization"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    CPU Utilization (%){" "}
                    <span className="text-slate-400 font-normal">(0-100)</span>
                  </label>
                  <input
                    id="add-cpuUtilization"
                    type="number"
                    name="cpuUtilization"
                    value={form.cpuUtilization}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                      errors.cpuUtilization ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.cpuUtilization && (
                    <p className="mt-1 text-xs text-rose-600">{errors.cpuUtilization}</p>
                  )}
                </div>

                {/* Memory Utilization */}
                <div>
                  <label
                    htmlFor="add-memoryUtilization"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Memory Utilization (%){" "}
                    <span className="text-slate-400 font-normal">(0-100)</span>
                  </label>
                  <input
                    id="add-memoryUtilization"
                    type="number"
                    name="memoryUtilization"
                    value={form.memoryUtilization}
                    onChange={handleChange}
                    placeholder="e.g. 35"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                      errors.memoryUtilization ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.memoryUtilization && (
                    <p className="mt-1 text-xs text-rose-600">{errors.memoryUtilization}</p>
                  )}
                </div>

                {/* Storage Utilization */}
                <div>
                  <label
                    htmlFor="add-storageUtilization"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Storage Utilization (%){" "}
                    <span className="text-slate-400 font-normal">(0-100)</span>
                  </label>
                  <input
                    id="add-storageUtilization"
                    type="number"
                    name="storageUtilization"
                    value={form.storageUtilization}
                    onChange={handleChange}
                    placeholder="e.g. 40"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                      errors.storageUtilization ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.storageUtilization && (
                    <p className="mt-1 text-xs text-rose-600">{errors.storageUtilization}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Request Count */}
                <div>
                  <label
                    htmlFor="add-requestCount"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Request Count{" "}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="add-requestCount"
                    type="number"
                    name="requestCount"
                    value={form.requestCount}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    min="0"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                      errors.requestCount ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.requestCount && (
                    <p className="mt-1 text-xs text-rose-600">{errors.requestCount}</p>
                  )}
                </div>

                {/* Data Transfer */}
                <div>
                  <label
                    htmlFor="add-dataTransferGb"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Data Transfer (GB){" "}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="add-dataTransferGb"
                    type="number"
                    name="dataTransferGb"
                    value={form.dataTransferGb}
                    onChange={handleChange}
                    placeholder="e.g. 150"
                    min="0"
                    className={`w-full px-3 py-2.5 text-sm bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                      errors.dataTransferGb ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.dataTransferGb && (
                    <p className="mt-1 text-xs text-rose-600">{errors.dataTransferGb}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Cost Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCostModal;
