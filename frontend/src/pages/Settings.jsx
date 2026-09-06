import { useState } from "react";
import toast from "react-hot-toast";
import {
  Cloud,
  Globe,
  DollarSign,
  Bell,
  Sparkles,
  Palette,
  Save,
  RotateCcw,
} from "lucide-react";

import SettingsSection from "../components/settings/SettingsSection";
import SettingsToggle from "../components/settings/SettingsToggle";
import SettingsSelect from "../components/settings/SettingsSelect";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "aiCloudCostOptimizerSettings";

const DEFAULT_SETTINGS = {
  cloudProvider: "AWS",
  region: "Mumbai",
  currency: "INR",
  costDisplay: "Monthly",
  costAlerts: true,
  monthlyThreshold: 50000,
  savingsAlerts: true,
  minimumSavingsThreshold: 10,
  includeLowImpact: true,
  prioritizeHighImpact: true,
  emailNotifications: true,
  costIncreaseAlerts: true,
  aiRecommendationAlerts: true,
  weeklySummary: true,
  theme: "Light",
  compactDashboard: false,
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // Fall through to defaults on parse error
  }
  return { ...DEFAULT_SETTINGS };
};

// ─── Settings Page ─────────────────────────────────────────────────────────────

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [thresholdError, setThresholdError] = useState("");

  // Generic field updater
  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "monthlyThreshold") setThresholdError("");
  };

  const handleSave = () => {
    // Validate monthly threshold
    const threshold = Number(settings.monthlyThreshold);
    if (!settings.monthlyThreshold || isNaN(threshold) || threshold <= 0) {
      setThresholdError("Threshold must be greater than 0.");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setThresholdError("");
    toast("Settings reset to defaults.", { icon: "↺" });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/60">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage application and optimization settings.
        </p>
      </div>

      {/* ── 1. Cloud Provider Preferences ── */}
      <SettingsSection
        icon={Cloud}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        iconBorder="border-amber-200/60"
        title="Cloud Provider Preferences"
        description="Configure your preferred cloud provider for cost analysis."
      >
        <SettingsSelect
          id="setting-provider"
          label="Primary Cloud Provider"
          value={settings.cloudProvider}
          onChange={(v) => update("cloudProvider", v)}
          options={[
            { value: "AWS", label: "AWS" },
            { value: "Azure", label: "Azure" },
            { value: "GCP", label: "GCP" },
          ]}
        />
        <SettingsSelect
          id="setting-region"
          label="Default Region"
          value={settings.region}
          onChange={(v) => update("region", v)}
          options={[
            { value: "US East", label: "US East" },
            { value: "Mumbai", label: "Mumbai" },
            { value: "Central India", label: "Central India" },
            { value: "US West", label: "US West" },
            { value: "Europe", label: "Europe" },
            { value: "Asia Pacific", label: "Asia Pacific" },
          ]}
        />
      </SettingsSection>

      {/* ── 2. Cost & Currency Settings ── */}
      <SettingsSection
        icon={DollarSign}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        iconBorder="border-emerald-200/60"
        title="Cost & Currency"
        description="Set your preferred currency and cost display period."
      >
        <SettingsSelect
          id="setting-currency"
          label="Currency"
          value={settings.currency}
          onChange={(v) => update("currency", v)}
          options={[
            { value: "INR", label: "INR (₹)" },
            { value: "USD", label: "USD ($)" },
            { value: "EUR", label: "EUR (€)" },
            { value: "GBP", label: "GBP (£)" },
          ]}
        />
        <SettingsSelect
          id="setting-costDisplay"
          label="Cost Display"
          value={settings.costDisplay}
          onChange={(v) => update("costDisplay", v)}
          options={[
            { value: "Monthly", label: "Monthly" },
            { value: "Weekly", label: "Weekly" },
            { value: "Daily", label: "Daily" },
          ]}
        />
      </SettingsSection>

      {/* ── 3. Cost Alert Settings ── */}
      <SettingsSection
        icon={Bell}
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        iconBorder="border-rose-200/60"
        title="Cost Alert Settings"
        description="Configure spending thresholds and alert behaviour."
      >
        <SettingsToggle
          id="toggle-costAlerts"
          label="Enable Cost Alerts"
          checked={settings.costAlerts}
          onChange={(v) => update("costAlerts", v)}
        />

        {/* Monthly Threshold input */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6 py-3.5 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="setting-threshold"
              className="text-sm font-medium text-slate-800"
            >
              Monthly Cost Threshold
            </label>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Receive an alert when monthly cloud spending exceeds this amount.
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-44">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">
                ₹
              </span>
              <input
                id="setting-threshold"
                type="number"
                min="1"
                value={settings.monthlyThreshold}
                onChange={(e) => update("monthlyThreshold", e.target.value)}
                className={`w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                  thresholdError ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
            </div>
            {thresholdError && (
              <p className="mt-1 text-xs text-rose-600">{thresholdError}</p>
            )}
          </div>
        </div>

        <SettingsToggle
          id="toggle-savingsAlerts"
          label="Enable Savings Alerts"
          description="Show notifications when significant optimization savings are detected."
          checked={settings.savingsAlerts}
          onChange={(v) => update("savingsAlerts", v)}
        />
      </SettingsSection>

      {/* ── 4. Optimization Preferences ── */}
      <SettingsSection
        icon={Sparkles}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        iconBorder="border-indigo-100"
        title="Optimization Preferences"
        description="Control how AI recommendations are filtered and prioritized."
      >
        <SettingsSelect
          id="setting-minSavings"
          label="Minimum Savings Threshold"
          description="Only show optimization recommendations above this savings percentage."
          value={String(settings.minimumSavingsThreshold)}
          onChange={(v) => update("minimumSavingsThreshold", Number(v))}
          options={[
            { value: "5", label: "5%" },
            { value: "10", label: "10%" },
            { value: "15", label: "15%" },
            { value: "20", label: "20%" },
          ]}
        />
        <SettingsToggle
          id="toggle-includeLowImpact"
          label="Include Low Impact Recommendations"
          checked={settings.includeLowImpact}
          onChange={(v) => update("includeLowImpact", v)}
        />
        <SettingsToggle
          id="toggle-prioritizeHighImpact"
          label="Prioritize High Impact Recommendations"
          checked={settings.prioritizeHighImpact}
          onChange={(v) => update("prioritizeHighImpact", v)}
        />
      </SettingsSection>

      {/* ── 5. Notification Preferences ── */}
      <SettingsSection
        icon={Bell}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        iconBorder="border-blue-100"
        title="Notification Preferences"
        description="Manage in-app notification behaviour for cost events and summaries."
      >
        <SettingsToggle
          id="toggle-emailNotifications"
          label="Email Notifications"
          description="Receive cost and optimization updates via email (configured in a later phase)."
          checked={settings.emailNotifications}
          onChange={(v) => update("emailNotifications", v)}
        />
        <SettingsToggle
          id="toggle-costIncreaseAlerts"
          label="Cost Increase Alerts"
          description="Get notified when cloud costs increase beyond expected thresholds."
          checked={settings.costIncreaseAlerts}
          onChange={(v) => update("costIncreaseAlerts", v)}
        />
        <SettingsToggle
          id="toggle-aiRecommendationAlerts"
          label="AI Recommendation Alerts"
          description="Receive alerts when new optimization recommendations are available."
          checked={settings.aiRecommendationAlerts}
          onChange={(v) => update("aiRecommendationAlerts", v)}
        />
        <SettingsToggle
          id="toggle-weeklySummary"
          label="Weekly Cost Summary"
          description="Receive a weekly digest of cloud spending and savings opportunities."
          checked={settings.weeklySummary}
          onChange={(v) => update("weeklySummary", v)}
        />
      </SettingsSection>

      {/* ── 6. Appearance Preferences ── */}
      <SettingsSection
        icon={Palette}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
        iconBorder="border-violet-100"
        title="Appearance"
        description="Customize the visual theme and dashboard layout."
      >
        <SettingsSelect
          id="setting-theme"
          label="Theme"
          description="Full dark mode will be available in a later phase."
          value={settings.theme}
          onChange={(v) => update("theme", v)}
          options={[
            { value: "Light", label: "Light" },
            { value: "Dark", label: "Dark (coming soon)" },
            { value: "System", label: "System" },
          ]}
        />
        <SettingsToggle
          id="toggle-compactDashboard"
          label="Compact Dashboard"
          description="Reduce padding and card spacing for a denser information display."
          checked={settings.compactDashboard}
          onChange={(v) => update("compactDashboard", v)}
        />
      </SettingsSection>

      {/* ── Save / Reset Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-6">
        <p className="text-xs text-slate-400">
          Changes are not saved until you click <strong className="text-slate-600">Save Settings</strong>.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Reset to Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
