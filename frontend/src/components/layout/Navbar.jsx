import { Bell, User, Menu } from "lucide-react";

function Navbar({ onToggleSidebar }) {
  return (
    <nav className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-2xs">
      
      {/* Left Side: Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            AI Cloud Cost Optimizer
          </h1>
          <p className="text-xs text-slate-500">
            Monitor & Optimize Cloud Costs
          </p>
        </div>
      </div>

      {/* Right Side: Notification & User Profile */}
      <div className="flex items-center gap-3">
        
        {/* Notification Button */}
        <button
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-150 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Notification Dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        </button>

        {/* Profile Button */}
        <button
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-label="User profile"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-medium text-xs border border-indigo-100">
            <User size={16} />
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700">
            User
          </span>
        </button>

      </div>
    </nav>
  );
}

export default Navbar;