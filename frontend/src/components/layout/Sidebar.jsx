import { 
  LayoutDashboard, 
  Cloud, 
  BarChart3, 
  Lightbulb, 
  Settings,
  X,
  Sparkles,
  LogOut
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const getNavLinkClass = ({ isActive }) => `
    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer
    ${isActive 
      ? "bg-indigo-600 text-white shadow-xs" 
      : "text-slate-300 hover:text-white hover:bg-slate-800/80"}
  `;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800/80 
        flex flex-col p-4 transition-transform duration-200 ease-in-out shrink-0
        md:static md:translate-x-0 min-h-screen
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-3 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight leading-tight">
              Cloud Optimizer
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              AI Cost Management
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <NavLink 
          to="/" 
          end 
          onClick={handleNavClick}
          className={getNavLinkClass}
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={19} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/cloud-costs" 
          onClick={handleNavClick}
          className={getNavLinkClass}
        >
          {({ isActive }) => (
            <>
              <Cloud size={19} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>Cloud Costs</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/analytics" 
          onClick={handleNavClick}
          className={getNavLinkClass}
        >
          {({ isActive }) => (
            <>
              <BarChart3 size={19} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>Analytics</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/ai-recommendations" 
          onClick={handleNavClick}
          className={getNavLinkClass}
        >
          {({ isActive }) => (
            <>
              <Lightbulb size={19} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>AI Recommendations</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/settings" 
          onClick={handleNavClick}
          className={getNavLinkClass}
        >
          {({ isActive }) => (
            <>
              <Settings size={19} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>Settings</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Footer Area: User details + AI Status badge */}
      <div className="pt-4 border-t border-slate-800/80 px-2 space-y-3">
        {user && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Engine Active</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;