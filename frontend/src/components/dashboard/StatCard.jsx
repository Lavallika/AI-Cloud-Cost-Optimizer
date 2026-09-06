function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
      
      <div className="flex items-start justify-between">
        
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>

          {subtitle && (
            <p className="text-xs text-slate-500 font-normal pt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0">
          {Icon && <Icon size={22} className="text-indigo-600" />}
        </div>

      </div>

    </div>
  );
}

export default StatCard;