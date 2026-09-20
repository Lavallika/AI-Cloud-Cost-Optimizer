import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Printer,
  FileSpreadsheet,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  PiggyBank,
  Cloud,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchFullReportData,
  generateCostReportCsv,
  downloadCsvFile,
  formatCurrency,
  formatDate,
} from "../utils/reportUtils";

function CostReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const periodParam = searchParams.get("period") || "Last 6 Months";

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFullReportData(periodParam);
      setReportData(data);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Unable to generate the report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [periodParam]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!reportData) return;
    try {
      const csv = generateCostReportCsv(reportData);
      const todayStr = formatDate(new Date());
      downloadCsvFile(csv, `AI-Cloud-Cost-Optimizer-Report-${todayStr}.csv`);
      toast.success("CSV downloaded successfully!");
    } catch (err) {
      console.error("CSV download error:", err);
      toast.error("Failed to download CSV.");
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4 animate-pulse">
          <Sparkles size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Preparing your cloud cost report...</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
          Aggregating user cost records, billing metrics, and AI optimization recommendations.
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="p-3 rounded-full bg-rose-50 text-rose-600 mb-3 border border-rose-100">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{error}</h2>
        <p className="text-sm text-slate-500 mt-1">Please verify your database connection and try again.</p>
        <button
          onClick={loadReport}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
        >
          <RotateCcw size={16} />
          <span>Retry Report</span>
        </button>
      </div>
    );
  }

  const {
    summary = {},
    costByService = [],
    costByRegion = [],
    monthlyTrend = [],
    recommendations = [],
    recentCosts = [],
    periodLabel,
    generatedDate,
  } = reportData || {};

  const hasAnyCosts = summary.totalCost > 0 || recentCosts.length > 0;

  return (
    <div className="report-container max-w-5xl mx-auto space-y-8 pb-12 print:p-0 print:m-0 print:max-w-none print:w-full">
      {/* Print Specific CSS Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.2cm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 11pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, nav, header, .print\\:hidden, .no-print, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .report-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 1.5rem !important;
          }
          .report-table th, .report-table td {
            padding: 6px 10px !important;
            font-size: 9pt !important;
          }
          .report-card {
            box-shadow: none !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Navigation & Action Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate("/analytics")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={16} />
          <span>Back to Analytics</span>
        </button>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs print:border-none print:shadow-none print:p-0 space-y-8">
        
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Sparkles size={18} />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  AI CLOUD COST OPTIMIZER
                </h1>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-700 mt-2">
                Cloud Cost & AI Optimization Report
              </h2>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs text-slate-500 bg-slate-50 print:bg-transparent p-3 sm:p-0 rounded-xl">
              <p>
                <span className="font-semibold text-slate-700">Report Period:</span>{" "}
                <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50 print:border-none print:p-0 print:bg-transparent print:text-slate-900">
                  <Calendar size={12} className="print:hidden" />
                  {periodLabel}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Generated On:</span> {generatedDate}
              </p>
              <p className="text-[11px] text-slate-400">
                Data Scope: Authenticated User Account
              </p>
            </div>
          </div>
        </div>

        {/* Empty State Warning if user has no records */}
        {!hasAnyCosts ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
            <Cloud size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No cloud cost data available</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Add cloud cost records to generate a meaningful report. Once costs are logged, executive metrics, service breakdowns, and AI recommendations will populate here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* 1. EXECUTIVE SUMMARY */}
            <section className="report-section space-y-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                1. Executive Summary
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="report-card p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-medium text-slate-500">Total Cloud Cost</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(summary.totalCost)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Across {periodLabel.toLowerCase()}</p>
                </div>

                <div className="report-card p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-medium text-slate-500">Average Monthly Cost</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(summary.averageCost)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Monthly average</p>
                </div>

                <div className="report-card p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                  <p className="text-xs font-medium text-emerald-800">Potential Monthly Savings</p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">
                    {formatCurrency(summary.potentialSavings)}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">AI-estimated potential savings</p>
                </div>

                <div className="report-card p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-medium text-slate-500">Active Resources</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {summary.activeResources}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tracked cloud resources</p>
                </div>
              </div>
            </section>

            {/* 2 & 3. COST BY SERVICE & COST BY REGION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 2. COST BY SERVICE */}
              <section className="report-section space-y-3">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                  2. Cost by Service
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="report-table w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Service</th>
                        <th className="p-3 text-right">Cost</th>
                        <th className="p-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {costByService.length > 0 ? (
                        costByService.map((s) => (
                          <tr key={s.service} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-900">{s.service}</td>
                            <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(s.cost)}</td>
                            <td className="p-3 text-right text-slate-500">{s.percentage}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">No service cost data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. COST BY REGION */}
              <section className="report-section space-y-3">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                  3. Cost by Region
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="report-table w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Region</th>
                        <th className="p-3 text-right">Cost</th>
                        <th className="p-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {costByRegion.length > 0 ? (
                        costByRegion.map((r) => (
                          <tr key={r.region} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-900">{r.region}</td>
                            <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(r.cost)}</td>
                            <td className="p-3 text-right text-slate-500">{r.percentage}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">No region cost data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>

            {/* 4. MONTHLY COST TREND */}
            <section className="report-section space-y-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                4. Monthly Cost Trend
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="report-table w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3">Period / Month</th>
                      <th className="p-3 text-right">Total Recorded Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyTrend.length > 0 ? (
                      monthlyTrend.map((t) => (
                        <tr key={t.month} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-900">{t.month}</td>
                          <td className="p-3 text-right font-semibold text-slate-900">{formatCurrency(t.cost)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-slate-400">No monthly trend data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. AI OPTIMIZATION RECOMMENDATIONS */}
            <section className="report-section space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  5. AI Optimization Recommendations
                </h3>
                <span className="text-[11px] font-medium text-indigo-600">
                  Powered by ML Optimization Engine
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="report-table w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3">Resource / Service</th>
                      <th className="p-3">Recommended Optimization</th>
                      <th className="p-3 text-right">Current Cost</th>
                      <th className="p-3 text-right">Est. Cost</th>
                      <th className="p-3 text-right">Potential Savings</th>
                      <th className="p-3 text-center">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec) => (
                        <tr key={rec.id || rec.dbId} className="hover:bg-slate-50/50 align-top">
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">{rec.resource || rec.resource_name || rec.service}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{rec.provider} • {rec.service} • {rec.region}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-indigo-700">{rec.recommendedConfig || rec.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{rec.reason || rec.description}</p>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(rec.currentCost)}</td>
                          <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(rec.estimatedCost)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            {formatCurrency(rec.monthlySavings)}
                            {rec.savingsPercentage > 0 && (
                              <span className="block text-[10px] text-emerald-700">({rec.savingsPercentage}% savings)</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              rec.impact === "High"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : rec.impact === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {rec.impact || "Medium"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          All cloud resources are currently optimized. No recommendations identified.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. RECENT COST ACTIVITY */}
            <section className="report-section space-y-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 pb-1.5">
                6. Recent Cost Activity (Latest Records)
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="report-table w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3">Resource Name</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Service</th>
                      <th className="p-3">Region</th>
                      <th className="p-3 text-right">Monthly Cost</th>
                      <th className="p-3 text-right">Billing Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentCosts.length > 0 ? (
                      recentCosts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{c.resource_name || c.resource || "Cloud Resource"}</td>
                          <td className="p-3 text-slate-600">{c.provider}</td>
                          <td className="p-3 text-slate-600">{c.service}</td>
                          <td className="p-3 text-slate-500">{c.region}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(c.current_monthly_cost || c.currentCost)}</td>
                          <td className="p-3 text-right text-slate-500">{formatDate(c.billing_date || c.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">No cost activity logged</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* 7. REPORT DISCLAIMER */}
        <section className="report-section pt-4 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                Report Disclaimer
              </p>
              <p className="leading-relaxed">
                AI-generated savings figures are estimates based on available cloud usage and cost data. Actual savings may vary depending on resource configuration, workload, pricing, and billing conditions.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default CostReport;
