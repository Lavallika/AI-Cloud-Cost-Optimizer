import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  Cpu,
  Database,
  HardDrive,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Server,
  Zap,
  TrendingDown,
  Info,
  Lightbulb,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { predictCloudCost, getModelInfo, checkMlHealth, optimizeCloudCost } from "../../services/mlApi";

const DEFAULT_FORM_VALUES = {
  provider: "AWS",
  service: "EC2",
  region: "Mumbai",
  cpu_utilization: 35,
  memory_utilization: 40,
  storage_utilization: 50,
  usage_hours: 720,
  request_count: 100000,
  data_transfer_gb: 250,
};

export default function AICostPrediction() {
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizationError, setOptimizationError] = useState(null);

  // Model Metadata & Service Health state
  const [modelInfo, setModelInfo] = useState(null);
  const [loadingModelInfo, setLoadingModelInfo] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null); // null | 'online' | 'offline'

  // Fetch health check & model info on mount
  useEffect(() => {
    fetchHealthAndModelInfo();
  }, []);

  const fetchHealthAndModelInfo = async () => {
    setLoadingModelInfo(true);
    
    // Check Health
    const health = await checkMlHealth();
    if (health.online) {
      setHealthStatus("online");
    } else {
      setHealthStatus("offline");
    }

    // Fetch Model Info
    const res = await getModelInfo();
    if (res.success) {
      setModelInfo(res.data);
    } else {
      setModelInfo(null);
    }
    setLoadingModelInfo(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on field change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const cpu = Number(formData.cpu_utilization);
    if (isNaN(cpu) || cpu < 0 || cpu > 100) {
      newErrors.cpu_utilization = "CPU utilization must be between 0 and 100%";
    }

    const memory = Number(formData.memory_utilization);
    if (isNaN(memory) || memory < 0 || memory > 100) {
      newErrors.memory_utilization = "Memory utilization must be between 0 and 100%";
    }

    const storage = Number(formData.storage_utilization);
    if (isNaN(storage) || storage < 0 || storage > 100) {
      newErrors.storage_utilization = "Storage utilization must be between 0 and 100%";
    }

    const hours = Number(formData.usage_hours);
    if (isNaN(hours) || hours < 0) {
      newErrors.usage_hours = "Usage hours must be 0 or greater";
    }

    const requests = Number(formData.request_count);
    if (isNaN(requests) || requests < 0) {
      newErrors.request_count = "Request count must be 0 or greater";
    }

    const dataTransfer = Number(formData.data_transfer_gb);
    if (isNaN(dataTransfer) || dataTransfer < 0) {
      newErrors.data_transfer_gb = "Data transfer must be 0 GB or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPredictionError(null);

    if (!validate()) {
      toast.error("Please correct invalid form fields before predicting.");
      return;
    }

    setLoading(true);
    setPrediction(null);

    const toastId = toast.loading("Predicting cloud cost...");

    try {
      const result = await predictCloudCost(formData);

      if (result.success) {
        setPrediction(result);
        toast.success(result.message || "Monthly cloud cost predicted successfully!", {
          id: toastId,
        });
      } else {
        setPredictionError(result.error);
        toast.error(result.error, { id: toastId });
      }
    } catch (err) {
      const errMsg = "ML service is unavailable. Please make sure the FastAPI service is running on port 8001.";
      setPredictionError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
      // Re-verify health status
      const health = await checkMlHealth();
      setHealthStatus(health.online ? "online" : "offline");
    }
  };

  const handleAnalyzeAndOptimize = async () => {
    setOptimizationError(null);

    if (!validate()) {
      toast.error("Please correct invalid form fields before running optimization analysis.");
      return;
    }

    setOptimizing(true);
    const toastId = toast.loading("Analyzing utilization & generating recommendations...");

    try {
      const result = await optimizeCloudCost(formData);

      if (result.success) {
        setOptimizationResult(result);
        // Sync prediction state if not set
        if (!prediction) {
          setPrediction({
            predicted_monthly_cost: result.predicted_monthly_cost,
            currency: result.currency,
            model: "RandomForestRegressor",
            message: "Monthly cloud cost predicted successfully",
          });
        }
        toast.success(result.message || "AI-powered optimization recommendations generated successfully!", {
          id: toastId,
        });

        // Smooth scroll to optimization result section
        setTimeout(() => {
          const section = document.getElementById("ai-optimization-summary-section");
          if (section) {
            section.scrollIntoView({ behavior: "smooth" });
          }
        }, 150);
      } else {
        setOptimizationError(result.error);
        toast.error(result.error, { id: toastId });
      }
    } catch (err) {
      const errMsg = "ML service is unavailable. Please make sure the FastAPI service is running on port 8001.";
      setOptimizationError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setOptimizing(false);
      const health = await checkMlHealth();
      setHealthStatus(health.online ? "online" : "offline");
    }
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_FORM_VALUES);
    setErrors({});
    setPrediction(null);
    setPredictionError(null);
    setOptimizationResult(null);
    setOptimizationError(null);
    toast.success("Form reset to default parameters.");
  };

  return (
    <div className="space-y-8">
      {/* AI Cost Prediction Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Section */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI Cost Prediction
              </h2>
            </div>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
              Predict your monthly cloud cost using our trained Random Forest ML model.
            </p>
          </div>

          {/* API Status Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700/80">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : healthStatus === "offline"
                    ? "bg-rose-400"
                    : "bg-amber-400"
                }`}
              />
              <span className={healthStatus === "online" ? "text-emerald-300" : healthStatus === "offline" ? "text-rose-300" : "text-amber-300"}>
                {healthStatus === "online"
                  ? "ML Service Online"
                  : healthStatus === "offline"
                  ? "ML Service Offline"
                  : "Checking Status..."}
              </span>
            </div>

            <button
              type="button"
              onClick={fetchHealthAndModelInfo}
              title="Refresh Service Status"
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={16} className={loadingModelInfo ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Main Grid: Form + Results & Model Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Server size={18} className="text-indigo-600" />
                <span>Resource Configuration</span>
              </h3>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Categorical Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Cloud Provider */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Cloud Provider
                  </label>
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="AWS">AWS</option>
                    <option value="Azure">Azure</option>
                    <option value="GCP">GCP</option>
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Service
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="EC2">EC2</option>
                    <option value="S3">S3</option>
                    <option value="RDS">RDS</option>
                    <option value="Lambda">Lambda</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Region
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="US East">US East</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Europe">Europe</option>
                  </select>
                </div>
              </div>

              {/* Metric Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CPU Utilization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Cpu size={14} className="text-indigo-500" /> CPU Utilization
                    </span>
                    <span className="text-slate-500 font-normal">%</span>
                  </label>
                  <input
                    type="number"
                    name="cpu_utilization"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.cpu_utilization}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.cpu_utilization ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.cpu_utilization && (
                    <p className="text-xs text-rose-600 mt-1">{errors.cpu_utilization}</p>
                  )}
                </div>

                {/* Memory Utilization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Database size={14} className="text-indigo-500" /> Memory Utilization
                    </span>
                    <span className="text-slate-500 font-normal">%</span>
                  </label>
                  <input
                    type="number"
                    name="memory_utilization"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.memory_utilization}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.memory_utilization ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.memory_utilization && (
                    <p className="text-xs text-rose-600 mt-1">{errors.memory_utilization}</p>
                  )}
                </div>

                {/* Storage Utilization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <HardDrive size={14} className="text-indigo-500" /> Storage Utilization
                    </span>
                    <span className="text-slate-500 font-normal">%</span>
                  </label>
                  <input
                    type="number"
                    name="storage_utilization"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.storage_utilization}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.storage_utilization ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.storage_utilization && (
                    <p className="text-xs text-rose-600 mt-1">{errors.storage_utilization}</p>
                  )}
                </div>
              </div>

              {/* Usage Hours, Requests, Data Transfer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Usage Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-indigo-500" /> Usage Hours
                    </span>
                    <span className="text-slate-500 font-normal">hrs</span>
                  </label>
                  <input
                    type="number"
                    name="usage_hours"
                    min="0"
                    step="1"
                    value={formData.usage_hours}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.usage_hours ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.usage_hours && (
                    <p className="text-xs text-rose-600 mt-1">{errors.usage_hours}</p>
                  )}
                </div>

                {/* Request Count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers size={14} className="text-indigo-500" /> Request Count
                    </span>
                    <span className="text-slate-500 font-normal">req</span>
                  </label>
                  <input
                    type="number"
                    name="request_count"
                    min="0"
                    step="100"
                    value={formData.request_count}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.request_count ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.request_count && (
                    <p className="text-xs text-rose-600 mt-1">{errors.request_count}</p>
                  )}
                </div>

                {/* Data Transfer GB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap size={14} className="text-indigo-500" /> Data Transfer
                    </span>
                    <span className="text-slate-500 font-normal">GB</span>
                  </label>
                  <input
                    type="number"
                    name="data_transfer_gb"
                    min="0"
                    step="1"
                    value={formData.data_transfer_gb}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.data_transfer_gb ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                    } rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                  />
                  {errors.data_transfer_gb && (
                    <p className="text-xs text-rose-600 mt-1">{errors.data_transfer_gb}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Predict Monthly Cost & Analyze & Optimize */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading || optimizing}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Predicting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Predict Monthly Cost</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeAndOptimize}
                  disabled={loading || optimizing}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {optimizing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={18} />
                      <span>Analyze &amp; Optimize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Prediction Result & Model Info (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/60 space-y-6 flex flex-col justify-between">
            {/* Prediction Result Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BarChart3 size={15} className="text-indigo-600" />
                <span>Prediction Result</span>
              </h3>

              {prediction ? (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
                    <span className="text-xs font-medium text-indigo-300 uppercase tracking-wide">
                      AI Predicted Monthly Cost
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Live ML
                    </span>
                  </div>

                  <div className="py-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      ₹{Number(prediction.predicted_monthly_cost).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-indigo-200 mt-1 font-medium">
                      {prediction.message || "Monthly cloud cost predicted successfully"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block">Model</span>
                      <span className="font-semibold text-slate-200">{prediction.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Currency</span>
                      <span className="font-semibold text-slate-200">{prediction.currency}</span>
                    </div>
                  </div>

                  {/* Analyze & Optimize trigger button inside result card */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAnalyzeAndOptimize}
                      disabled={optimizing}
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {optimizing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Generating Recommendations...</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={14} />
                          <span>Analyze &amp; Generate Recommendations</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : predictionError ? (
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                    <AlertCircle size={18} />
                    <span>Prediction Failed</span>
                  </div>
                  <p className="text-xs text-rose-600 leading-relaxed">{predictionError}</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Ready to Predict</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Adjust resource parameters and click &ldquo;Predict Monthly Cost&rdquo; or &ldquo;Analyze &amp; Optimize&rdquo;.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Model Information Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity size={15} className="text-indigo-600" />
                  <span>Trained Model Information</span>
                </h3>
                {modelInfo && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Target: {modelInfo.target || "monthly_cost"}
                  </span>
                )}
              </div>

              {loadingModelInfo ? (
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 text-center text-xs text-slate-500">
                  Loading model metrics...
                </div>
              ) : modelInfo ? (
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Model Algorithm</span>
                      <span className="font-semibold text-slate-800">{modelInfo.model_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">R² Score</span>
                      <span className="font-bold text-emerald-600">
                        {typeof modelInfo.r2 === "number" ? modelInfo.r2.toFixed(4) : modelInfo.r2}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">MAE</span>
                      <span className="font-semibold text-slate-800">
                        ₹{typeof modelInfo.mae === "number" ? modelInfo.mae.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : modelInfo.mae}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">RMSE</span>
                      <span className="font-semibold text-slate-800">
                        ₹{typeof modelInfo.rmse === "number" ? modelInfo.rmse.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : modelInfo.rmse}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Training Records</span>
                      <span className="font-semibold text-slate-800">{modelInfo.training_records}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Test Records</span>
                      <span className="font-semibold text-slate-800">{modelInfo.test_records}</span>
                    </div>
                  </div>

                  {Array.isArray(modelInfo.features) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Features: {modelInfo.features.length}</span>
                      <span className="font-medium text-indigo-600">RandomForestRegressor v1.0</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800">
                  Model information unavailable. Verify FastAPI service on port 8001.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Optimization Results & Summary Section */}
      {(optimizationResult || optimizationError) && (
        <div id="ai-optimization-summary-section" className="space-y-6 pt-4">
          {optimizationError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-rose-700">
                <AlertCircle size={18} />
                <span>Optimization Analysis Error</span>
              </div>
              <p className="text-xs text-rose-600 leading-relaxed">{optimizationError}</p>
            </div>
          ) : optimizationResult ? (
            <div className="space-y-6">
              {/* Summary Header & Metric Cards */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Lightbulb size={22} className="text-amber-500" />
                      <span>AI Optimization Summary</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Resource optimization analysis generated by rule engine and ML cost model
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                    {optimizationResult.recommendations.length} Recommendations Found
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Card 1: Predicted Cost */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Predicted Monthly Cost
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      ₹{Number(optimizationResult.predicted_monthly_cost).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[11px] text-slate-400">RandomForest ML model</span>
                  </div>

                  {/* Card 2: Potential Savings */}
                  <div className="bg-emerald-50/70 rounded-xl p-5 border border-emerald-200/80 space-y-1">
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Potential Monthly Savings
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                      ₹{Number(optimizationResult.total_estimated_savings).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">Estimated optimization impact</span>
                  </div>

                  {/* Card 3: Recommendations Count */}
                  <div className="bg-indigo-50/70 rounded-xl p-5 border border-indigo-200/80 space-y-1">
                    <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                      Recommendations
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                      {optimizationResult.recommendations.length}
                    </div>
                    <span className="text-[11px] text-indigo-600 font-medium">Optimization opportunities</span>
                  </div>
                </div>

                {/* Mandatory Disclaimer Box */}
                <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    These savings are estimated based on the provided utilization data and are not actual cloud-provider billing guarantees.
                  </p>
                </div>
              </div>

              {/* Recommendation Cards Grid */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag size={18} className="text-indigo-600" />
                  <span>Optimization Opportunities</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {optimizationResult.recommendations.map((rec, index) => {
                    const isHigh = rec.impact === "High";
                    const isMedium = rec.impact === "Medium";

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="font-semibold text-slate-900 text-base leading-snug">
                              {rec.title}
                            </h5>

                            {/* Impact Badge */}
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full border shrink-0 ${
                                isHigh
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : isMedium
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {rec.impact} Impact
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {rec.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                              {rec.category || "General Optimization"}
                            </span>
                            <span className="font-semibold text-slate-400">
                              Priority #{rec.priority || index + 1}
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                              <ArrowUpRight size={16} className="text-emerald-600" />
                              Estimated Potential Savings
                            </span>
                            <span className="text-base font-bold text-emerald-700">
                              ₹{Number(rec.estimated_savings).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
