import React from "react";
import { CheckCheck, RefreshCw, BellOff, Loader2, AlertCircle } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import NotificationItem from "./NotificationItem";

function NotificationDropdown({ isOpen, onClose, dropdownRef }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="region"
      aria-label="Notifications list"
      className="absolute right-0 mt-2 w-[360px] sm:w-[400px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn text-slate-800"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => refreshNotifications()}
            disabled={loading}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh notifications"
            title="Refresh notifications"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Mark All As Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
              aria-label="Mark all notifications as read"
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Body */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
        {/* Loading State */}
        {loading && notifications.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading notifications...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle size={24} className="text-red-500 mb-2" />
            <p className="text-xs font-semibold text-slate-800 mb-1">{error}</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Check your network connection and try again.
            </p>
            <button
              onClick={() => refreshNotifications()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <BellOff size={22} />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-0.5">No notifications yet</p>
            <p className="text-[11px] text-slate-500">You're all caught up.</p>
          </div>
        ) : (
          /* Notification Items List */
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{notifications.length} total notifications</span>
          {unreadCount === 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCheck size={12} /> All caught up
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
