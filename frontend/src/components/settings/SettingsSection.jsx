// Reusable labelled card section wrapper for the Settings page
function SettingsSection({ icon: Icon, iconBg = "bg-indigo-50", iconColor = "text-indigo-600", iconBorder = "border-indigo-100", title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-slate-100">
        <div className={`p-2.5 rounded-xl border shrink-0 ${iconBg} ${iconColor} ${iconBorder}`}>
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {/* Card Body */}
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}

export default SettingsSection;
