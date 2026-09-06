import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 sm:p-12 shadow-xs max-w-md w-full text-center space-y-6">
        {/* 404 Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Link */}
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors duration-150 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
