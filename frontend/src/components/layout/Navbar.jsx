import { useState, useRef, useEffect } from "react";
import { Bell, User, Menu, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    toast.success("Logged out successfully");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

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

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="User profile menu"
            aria-expanded={dropdownOpen}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
              {user?.name ? getInitials(user.name) : <User size={15} />}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
              {user?.name || "User"}
            </span>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email || "Signed in"}
                </p>
              </div>

              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;