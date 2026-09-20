import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, FileSpreadsheet, FileText, Download, Calendar, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchFullReportData,
  generateCostReportCsv,
  downloadCsvFile,
  formatDate,
} from "../../utils/reportUtils";

function ExportReportModal({ isOpen, onClose, initialPeriod = "Last 6 Months" }) {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [exportFormat, setExportFormat] = useState("CSV");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (exportFormat === "PDF") {
      onClose();
      navigate(`/reports/cost?period=${encodeURIComponent(selectedPeriod)}`);
      return;
    }

    // CSV Export Flow
    setIsExporting(true);
    try {
      toast.loading("Generating your CSV report...", { id: "export-toast" });
      const reportData = await fetchFullReportData(selectedPeriod);
      const csvContent = generateCostReportCsv(reportData);
      const todayStr = formatDate(new Date());
      const filename = `AI-Cloud-Cost-Optimizer-Report-${todayStr}.csv`;

      downloadCsvFile(csvContent, filename);
      toast.success("CSV report downloaded successfully!", { id: "export-toast" });
      onClose();
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Failed to generate CSV report. Please try again.", { id: "export-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Export Cloud Cost Report
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generate a report from your current cloud cost and AI optimization data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* 1. Report Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Report Period
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "Last 6 Months", label: "Last 6 Months" },
                { id: "Current Billing Period", label: "Current Billing Period" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPeriod(opt.id)}
                  className={`flex items-center gap-2 p-3 text-xs font-semibold rounded-xl border transition-all text-left cursor-pointer ${
                    selectedPeriod === opt.id
                      ? "bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <Calendar size={15} className={selectedPeriod === opt.id ? "text-indigo-600" : "text-slate-400"} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Export Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportFormat("CSV")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                  exportFormat === "CSV"
                    ? "bg-emerald-50/70 border-emerald-500 text-emerald-900 shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${exportFormat === "CSV" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">CSV</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Spreadsheet (.csv)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("PDF")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                  exportFormat === "PDF"
                    ? "bg-rose-50/70 border-rose-500 text-rose-900 shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${exportFormat === "PDF" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">PDF / Print</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Printable Report</p>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 px-6 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ExportReportModal;
