import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 animate-pulse">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Cloud Cost Optimizer</h2>
            <p className="text-xs text-slate-400 mt-1">Verifying secure session...</p>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium pt-2">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading workspace</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
