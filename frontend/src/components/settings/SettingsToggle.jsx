// Animated toggle switch (ON = indigo, OFF = slate)
function SettingsToggle({ id, label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-800 cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Switch track */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
          checked
            ? "bg-indigo-600 border-indigo-600"
            : "bg-slate-200 border-slate-200"
        }`}
      >
        {/* Thumb */}
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsToggle;
