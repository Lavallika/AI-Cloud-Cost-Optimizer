import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Cloud,
  DollarSign,
  Bell,
  Sparkles,
  Palette,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";

import SettingsSection from "../components/settings/SettingsSection";
import SettingsToggle from "../components/settings/SettingsToggle";
import SettingsSelect from "../components/settings/SettingsSelect";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
} from "../services/notificationPreferenceApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "aiCloudCostOptimizerSettings";

const DEFAULT_LOCAL_SETTINGS = {
  cloudProvider: "AWS",
  region: "Mumbai",
  currency: "INR",
  costDisplay: "Monthly",
  minimumSavingsThreshold: 10,
  includeLowImpact: true,
  prioritizeHighImpact: true,
  emailNotifications: true,
  weeklySummary: true,
  theme: "Light",
  compactDashboard: false,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  costAlerts: true,
  monthlyThreshold: 10000,
  savingsAlerts: true,
  costIncreaseAlerts: true,
  lowUtilizationAlerts: true,
  aiRecommendationAlerts: true,
  // highCostAlerts and highCostThreshold share state with costAlerts / monthlyThreshold
  // (both map to high_cost_enabled / high_cost_threshold on the backend)
};

/**
 * Load local settings only (cloud provider, currency, theme, etc.)
 * Notification preferences are NEVER loaded from or stored in localStorage.
 */
const loadLocalSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Strip any notification preferences that might have been saved in earlier versions
      delete parsed.costAlerts;
      delete parsed.monthlyThreshold;
      delete parsed.savingsAlerts;
      delete parsed.costIncreaseAlerts;
      delete parsed.lowUtilizationAlerts;
      delete parsed.aiRecommendationAlerts;
      delete parsed.highCostThresholdInput;
      return { ...DEFAULT_LOCAL_SETTINGS, ...parsed };
    }
  } catch {
    // Fall through to defaults on parse error
  }
  return { ...DEFAULT_LOCAL_SETTINGS };
};

// ─── Settings Page ─────────────────────────────────────────────────────────────

function Settings() {
  const [settings, setSettings] = useState(() => ({
    ...loadLocalSettings(),
    ...DEFAULT_NOTIFICATION_SETTINGS,
  }));
  const [thresholdError, setThresholdError] = useState("");
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSavedThreshold, setLastSavedThreshold] = useState(10000);

  // Fetch notification preferences from PostgreSQL database on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      setIsLoadingPreferences(true);
      try {
        const res = await fetchNotificationPreferences();
        const prefs = res?.preferences || res?.data;

        if (isMounted && prefs) {
          const thresholdVal = Number(prefs.high_cost_threshold) || 10000;
          setSettings((prev) => ({
            ...prev,
            costAlerts: Boolean(prefs.high_cost_enabled),
            monthlyThreshold: thresholdVal,
            savingsAlerts: Boolean(prefs.optimization_opportunity_enabled),
            costIncreaseAlerts: Boolean(prefs.cost_increase_enabled),
            lowUtilizationAlerts: Boolean(prefs.low_utilization_enabled),
            aiRecommendationAlerts: Boolean(prefs.ai_recommendation_enabled),
          }));
          setLastSavedThreshold(thresholdVal);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load notification preferences:", err);
          toast.error("Failed to load notification preferences from server.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreferences(false);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  // Generic updater for local-only settings
  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "monthlyThreshold") setThresholdError("");
  };

  // Immediate updater for notification preferences via backend API
  const handleNotificationToggle = async (settingKey, backendField, newValue) => {
    const previousValue = settings[settingKey];

    // Optimistically update UI
    setSettings((prev) => ({ ...prev, [settingKey]: newValue }));
    setIsSaving(true);

    try {
      const res = await updateNotificationPreferences({ [backendField]: newValue });
      const updated = res?.preferences || res?.data;
      if (updated && updated[backendField] !== undefined) {
        setSettings((prev) => ({
          ...prev,
          [settingKey]: Boolean(updated[backendField]),
        }));
      }
      toast.success("Notification preference updated.");
    } catch (err) {
      // Revert UI change on error
      setSettings((prev) => ({ ...prev, [settingKey]: previousValue }));
      toast.error(err.message || "Failed to update notification preference.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save threshold through backend API on blur
  const handleThresholdBlur = async () => {
    const rawVal = settings.monthlyThreshold;
    const thresholdNum = Number(rawVal);

    if (rawVal === "" || rawVal === null || rawVal === undefined || isNaN(thresholdNum) || thresholdNum <= 0) {
      setThresholdError("Threshold must be a positive number.");
      toast.error("Threshold must be a positive number.");
      return;
    }

    if (thresholdNum > 10000000) {
      setThresholdError("Threshold cannot exceed ₹10,000,000.");
      toast.error("Threshold cannot exceed ₹10,000,000.");
      return;
    }

    if (thresholdNum === lastSavedThreshold) {
      setThresholdError("");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateNotificationPreferences({
        high_cost_threshold: thresholdNum,
      });
      const updated = res?.preferences || res?.data;
      if (updated && updated.high_cost_threshold !== undefined) {
        const savedVal = Number(updated.high_cost_threshold);
        setSettings((prev) => ({
          ...prev,
          monthlyThreshold: savedVal,
        }));
        setLastSavedThreshold(savedVal);
      }
      setThresholdError("");
      toast.success("Cost threshold saved.");
    } catch (err) {
      setSettings((prev) => ({ ...prev, monthlyThreshold: lastSavedThreshold }));
      setThresholdError("");
      toast.error(err.message || "Failed to update cost threshold.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Settings handler: persists local settings to localStorage & syncs threshold to backend
  const handleSave = async () => {
    const thresholdNum = Number(settings.monthlyThreshold);
    if (!settings.monthlyThreshold || isNaN(thresholdNum) || thresholdNum <= 0) {
      setThresholdError("Threshold must be a positive number.");
      toast.error("Threshold must be a positive number.");
      return;
    }

    if (thresholdNum > 10000000) {
      setThresholdError("Threshold cannot exceed ₹10,000,000.");
      toast.error("Threshold cannot exceed ₹10,000,000.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save local preferences (excluding notification preferences)
      const localSettingsToSave = { ...settings };
      delete localSettingsToSave.costAlerts;
      delete localSettingsToSave.monthlyThreshold;
      delete localSettingsToSave.savingsAlerts;
      delete localSettingsToSave.costIncreaseAlerts;
      delete localSettingsToSave.lowUtilizationAlerts;
      delete localSettingsToSave.aiRecommendationAlerts;
      delete localSettingsToSave.highCostThresholdInput;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(localSettingsToSave));

      // 2. Save threshold through backend API
      const res = await updateNotificationPreferences({
        high_cost_threshold: thresholdNum,
      });
      const updated = res?.preferences || res?.data;
      if (updated && updated.high_cost_threshold !== undefined) {
        const savedVal = Number(updated.high_cost_threshold);
        setSettings((prev) => ({
          ...prev,
          monthlyThreshold: savedVal,
        }));
        setLastSavedThreshold(savedVal);
      }

      setThresholdError("");
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults handler: calls POST /api/notification-preferences/reset and clears localStorage
  const handleReset = async () => {
    setIsResetting(true);
    try {
      // 1. Reset backend preferences in PostgreSQL
      const res = await resetNotificationPreferences();
      const resetPrefs = res?.preferences || res?.data;

      // 2. Clear local storage
      localStorage.removeItem(STORAGE_KEY);

      const defaultThreshold = Number(resetPrefs?.high_cost_threshold) || 10000;

      // 3. Update state with database defaults
      setSettings({
        ...DEFAULT_LOCAL_SETTINGS,
        costAlerts: resetPrefs?.high_cost_enabled ?? true,
        monthlyThreshold: defaultThreshold,
        savingsAlerts: resetPrefs?.optimization_opportunity_enabled ?? true,
        costIncreaseAlerts: resetPrefs?.cost_increase_enabled ?? true,
        lowUtilizationAlerts: resetPrefs?.low_utilization_enabled ?? true,
        aiRecommendationAlerts: resetPrefs?.ai_recommendation_enabled ?? true,
      });

      setLastSavedThreshold(defaultThreshold);
      setThresholdError("");
      toast("Settings reset to defaults.", { icon: "↺" });
    } catch (err) {
      toast.error(err.message || "Failed to reset notification preferences.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage application and optimization settings.
          </p>
        </div>
        {isLoadingPreferences && (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading preferences...</span>
          </div>
        )}
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
          onChange={(v) => handleNotificationToggle("costAlerts", "high_cost_enabled", v)}
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
                onBlur={handleThresholdBlur}
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
          onChange={(v) =>
            handleNotificationToggle("savingsAlerts", "optimization_opportunity_enabled", v)
          }
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
          id="toggle-highCostAlerts"
          label="High Cost Alerts"
          description="Get notified when a resource's monthly cost exceeds the high-cost threshold."
          checked={settings.costAlerts}
          onChange={(v) =>
            handleNotificationToggle("costAlerts", "high_cost_enabled", v)
          }
        />
        <SettingsToggle
          id="toggle-costIncreaseAlerts"
          label="Cost Increase Alerts"
          description="Get notified when cloud costs increase beyond expected thresholds."
          checked={settings.costIncreaseAlerts}
          onChange={(v) =>
            handleNotificationToggle("costIncreaseAlerts", "cost_increase_enabled", v)
          }
        />
        <SettingsToggle
          id="toggle-lowUtilizationAlerts"
          label="Low Utilization Alerts"
          description="Get notified when cloud resources report low resource utilization."
          checked={settings.lowUtilizationAlerts}
          onChange={(v) =>
            handleNotificationToggle("lowUtilizationAlerts", "low_utilization_enabled", v)
          }
        />
        <SettingsToggle
          id="toggle-aiRecommendationAlerts"
          label="AI Recommendation Alerts"
          description="Receive alerts when new optimization recommendations are available."
          checked={settings.aiRecommendationAlerts}
          onChange={(v) =>
            handleNotificationToggle("aiRecommendationAlerts", "ai_recommendation_enabled", v)
          }
        />
        <SettingsToggle
          id="toggle-optimizationOpportunityAlerts"
          label="Optimization Opportunity Alerts"
          description="Get notified when AI detects cost-saving optimization opportunities."
          checked={settings.savingsAlerts}
          onChange={(v) =>
            handleNotificationToggle("savingsAlerts", "optimization_opportunity_enabled", v)
          }
        />
        <SettingsToggle
          id="toggle-weeklySummary"
          label="Weekly Cost Summary"
          description="Receive a weekly digest of cloud spending and savings opportunities."
          checked={settings.weeklySummary}
          onChange={(v) => update("weeklySummary", v)}
        />

        {/* High Cost Threshold input */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6 py-3.5 border-b border-slate-100 last:border-b-0">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="setting-high-cost-threshold"
              className="text-sm font-medium text-slate-800"
            >
              High Cost Threshold
            </label>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Trigger a High Cost Alert when a resource&apos;s monthly cost exceeds this amount.
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-44">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none">
                ₹
              </span>
              <input
                id="setting-high-cost-threshold"
                type="number"
                min="1"
                value={settings.monthlyThreshold}
                onChange={(e) => update("monthlyThreshold", e.target.value)}
                onBlur={handleThresholdBlur}
                disabled={isLoadingPreferences || isSaving}
                className={`w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  thresholdError ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
            </div>
            {thresholdError && (
              <p className="mt-1 text-xs text-rose-600">{thresholdError}</p>
            )}
          </div>
        </div>
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
          Notification preferences auto-save on toggle. Other changes are saved when you click{" "}
          <strong className="text-slate-600">Save Settings</strong>.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving || isLoadingPreferences}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            <span>{isResetting ? "Resetting..." : "Reset to Defaults"}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isResetting || isSaving || isLoadingPreferences}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
