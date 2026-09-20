import React from "react";
import {
  AlertTriangle,
  TrendingUp,
  Gauge,
  Sparkles,
  Lightbulb,
  Bell,
  Trash2,
} from "lucide-react";

/**
 * Format relative timestamp without external dependencies
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  if (isNaN(past)) return "";
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/**
 * Resolve visual icon and styling based on alert type and severity
 */
function getTypeConfig(type, severity) {
  switch (type) {
    case "HIGH_COST":
      return {
        icon: AlertTriangle,
        label: "High Cost",
        iconClass: "bg-red-50 text-red-600 border-red-200/70",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
      };
    case "COST_INCREASE":
      return {
        icon: TrendingUp,
        label: "Cost Spike",
        iconClass: "bg-amber-50 text-amber-600 border-amber-200/70",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "LOW_UTILIZATION":
      return {
        icon: Gauge,
        label: "Underutilized",
        iconClass: "bg-amber-50 text-amber-600 border-amber-200/70",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "AI_RECOMMENDATION":
      return {
        icon: Sparkles,
        label: "AI Recommendation",
        iconClass: "bg-indigo-50 text-indigo-600 border-indigo-200/70",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "OPTIMIZATION_OPPORTUNITY":
      return {
        icon: Lightbulb,
        label: "Optimization",
        iconClass: "bg-emerald-50 text-emerald-600 border-emerald-200/70",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      if (severity === "critical") {
        return {
          icon: AlertTriangle,
          label: "Critical Alert",
          iconClass: "bg-red-50 text-red-600 border-red-200/70",
          badgeClass: "bg-red-50 text-red-700 border-red-200",
        };
      }
      return {
        icon: Bell,
        label: "Notice",
        iconClass: "bg-blue-50 text-blue-600 border-blue-200/70",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
  }
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const { id, type, severity, title, message, is_read, source_id, created_at } = notification;

  const typeConfig = getTypeConfig(type, severity);
  const IconComponent = typeConfig.icon;
  const relativeTime = getRelativeTime(created_at);

  const handleClick = () => {
    if (!is_read && onMarkRead) {
      onMarkRead(id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative p-3.5 transition-colors duration-150 cursor-pointer text-left focus:outline-none focus:bg-slate-50 ${
        is_read
          ? "bg-white hover:bg-slate-50/80 opacity-80"
          : "bg-indigo-50/30 hover:bg-indigo-50/50 border-l-3 border-indigo-500"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Severity/Type Icon */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${typeConfig.iconClass}`}
        >
          <IconComponent size={16} />
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeConfig.badgeClass}`}
            >
              {typeConfig.label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium ml-auto">
              {relativeTime}
            </span>
          </div>

          <h4
            className={`text-xs text-slate-900 tracking-tight leading-snug mb-1 ${
              is_read ? "font-medium text-slate-700" : "font-semibold text-slate-900"
            }`}
          >
            {title}
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {message}
          </p>

          {source_id && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Cost Record #{source_id}</span>
              {!is_read && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-medium">Click to mark as read</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Delete Action Button */}
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
          aria-label="Delete notification"
          title="Delete notification"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default NotificationItem;
