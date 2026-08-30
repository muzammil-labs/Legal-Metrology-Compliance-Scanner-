import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileDown,
  MapPin,
  BarChart3,
  RefreshCw,
  ListFilter
} from "lucide-react";
import {
  fetchAnalyticsSummary,
  fetchInspections,
  getNoticeDownloadUrl,
} from "../services/api";

export default function InspectorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [summary, list] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchInspections(25),
      ]);
      setAnalytics(summary);
      setInspections(list);
    } catch (e) {
      console.error(e);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4">
        <RefreshCw className="animate-spin text-cyan-500" size={36} />
        <p className="font-mono text-sm tracking-wide">Loading Enforcement Analytics & Regional Docket...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-8">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
          <div className="flex items-center gap-3 text-rose-400 mb-3 font-bold text-lg">
            <AlertTriangle size={22} />
            <span>CRITICAL ERROR</span>
          </div>
          <p className="text-rose-300/80 m-0 text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }

  const regions = analytics?.by_region || {};
  const infractions = analytics?.by_rule_infractions || {};
  const districts = ["All", ...Object.keys(regions)];
  const maxInfraction = Math.max(...Object.values(infractions), 1);

  return (
    <section className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold m-0 tracking-tight text-white mb-2">Enforcement Analytics</h2>
          <p className="font-mono text-sm text-slate-400 m-0 uppercase tracking-widest">All India Retail Zones — Statutory Audit Trail</p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 h-[48px] shadow-sm focus-within:border-cyan-500/50 transition-colors">
            <ListFilter size={16} className="text-slate-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-100 border-none outline-none font-mono text-xs uppercase cursor-pointer w-full py-2 pr-4 appearance-none"
            >
              {districts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-100">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 rounded-xl px-5 h-[48px] font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-cyan-400" : ""} />
            <span>Refresh Data</span>
          </button>

          <a
            href="/api/analytics/export-csv"
            download="district_audit_export.csv"
            className="flex items-center gap-2 bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 rounded-xl px-5 h-[48px] font-bold text-sm transition-all active:scale-[0.98] no-underline shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <FileDown size={18} /> Export CSV
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg border-t-4 border-t-cyan-500 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Total Audits</span>
            <strong className="block text-4xl font-mono text-slate-100 mb-2 tracking-tight">{analytics?.total_inspections ?? 0}</strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium">Pre-seeded & live field records</small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Compliance Rate</span>
            <strong className="block text-4xl font-mono text-emerald-400 mb-2 tracking-tight">
              {analytics?.compliance_rate ?? 0}%
            </strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium">
            {analytics?.compliant_inspections ?? 0} passed / {analytics?.failed_inspections ?? 0} non-compliant
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg border-t-4 border-t-amber-500 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Active Districts</span>
            <strong className="block text-4xl font-mono text-slate-100 mb-2 tracking-tight">{Object.keys(regions).length}</strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium truncate" title="Delhi, Mumbai, Bengaluru, Kolkata, Chennai">
            Delhi, Mumbai, Bengaluru, Kolkata...
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg border-t-4 border-t-rose-500 flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Est. Compounding Fines</span>
            <strong className="block text-4xl font-mono text-rose-400 mb-2 tracking-tight">
               ₹{((analytics?.failed_inspections ?? 0) * 15000).toLocaleString('en-IN')}
            </strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium">Est. base ₹15K per violation</small>
        </div>
      </div>

      {/* Heatmap & Infraction Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <span className="flex items-center gap-2 text-base font-bold text-slate-200">
              <MapPin size={18} className="text-cyan-500" /> Regional Enforcement Heatmap
            </span>
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded">Active Audit Hubs</span>
          </div>

          <div className="flex flex-col gap-5 mt-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {Object.entries(regions)
              .filter(
                ([name]) =>
                  selectedDistrict === "All" || name === selectedDistrict,
              )
              .map(([name, count]) => (
                <div className="flex flex-col gap-2.5" key={name}>
                  <div className="flex justify-between items-center text-sm">
                    <b className="text-slate-200 font-semibold">{name}</b>
                    <span className="text-slate-400 text-xs font-mono bg-slate-800/50 px-2 py-0.5 rounded">{count} Audits</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      style={{
                        width: `${Math.min(100, (count / (analytics?.total_inspections || 1)) * 100 * 2.5)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <span className="flex items-center gap-2 text-base font-bold text-slate-200">
              <BarChart3 size={18} className="text-rose-500" /> Statutory Infraction Frequency
            </span>
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded">By Rule Code</span>
          </div>

          <div className="flex flex-col gap-5 mt-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {Object.entries(infractions).map(([rule, count]) => {
                const percentage = (count / maxInfraction) * 100;
                return (
              <div className="flex flex-col gap-2.5" key={rule}>
                <div className="flex justify-between items-center text-sm">
                  <strong className="text-slate-200 font-semibold">{rule}</strong>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold shadow-sm">{count} Violations</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-rose-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            )})}
            {Object.keys(infractions).length === 0 && (
                <div className="text-slate-500 text-sm text-center py-8 font-mono border border-dashed border-slate-700 rounded-xl">No infractions recorded in this region.</div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Inspection Docket */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
          <span className="text-base font-bold text-slate-200">Recent Audit Docket</span>
          <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded">Section 36 Ready</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/50">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead className="bg-slate-950/50">
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800/80">
                <th className="py-4 px-5">Dossier ID</th>
                <th className="py-4 px-5">Target SKU / File</th>
                <th className="py-4 px-5">Region & GPS</th>
                <th className="py-4 px-5">Trust Score</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Violations</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
              {inspections.map((row) => (
                <tr key={row.inspection_id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 px-5">
                    <code className="text-cyan-400 font-mono text-xs bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/30">LM-{String(row.inspection_id).padStart(6, "0")}</code>
                  </td>
                  <td className="py-4 px-5 font-medium text-slate-200">
                    {row.source_filename}
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-slate-300 font-medium mb-1">{row.region}</div>
                    <small className="text-slate-500 font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded">
                      {row.gps_location || "28.6139° N, 77.2090° E"}
                    </small>
                  </td>
                  <td className="py-4 px-5">
                    <span className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg font-mono text-xs border border-slate-800 font-bold shadow-inner">
                        {row.trust_score ?? 100}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${
                        row.overall_status === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                      }`}
                    >
                      {row.overall_status === "PASS" ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                      {row.overall_status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-400 text-xs font-mono font-medium">
                    {row.violation_count} Flags
                  </td>
                  <td className="py-4 px-5 text-right">
                    <a
                      href={getNoticeDownloadUrl(row.inspection_id)}
                      className="inline-flex items-center justify-center gap-2 text-cyan-400 hover:text-white bg-slate-950 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 px-4 py-2 rounded-xl text-xs font-bold transition-all no-underline shadow-sm active:scale-[0.96]"
                      download
                    >
                      <FileDown size={15} /> Section 36 PDF
                    </a>
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && !loading && (
                 <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 text-sm font-mono border-dashed border-t border-slate-800">No recent inspections found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
