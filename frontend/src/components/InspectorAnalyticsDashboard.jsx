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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-3">
        <RefreshCw className="animate-spin text-cyan-500" size={32} />
        <p className="font-mono text-sm">Loading Enforcement Analytics & Regional Docket...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-rose-400 mb-2 font-semibold">
            <AlertTriangle size={18} />
            <span>ERROR</span>
          </div>
          <p className="text-rose-300/80 m-0 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const regions = analytics?.by_region || {};
  const infractions = analytics?.by_rule_infractions || {};
  const districts = ["All", ...Object.keys(regions)];
  const maxInfraction = Math.max(...Object.values(infractions), 1);

  return (
    <section className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold m-0 tracking-tight text-white">Enforcement Analytics</h2>
          <p className="font-mono text-sm text-zinc-400 mt-1 mb-0">All India Retail Zones — Statutory Audit Trail</p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District filter from feature branch */}
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-lg px-3 h-[48px]">
            <ListFilter size={16} className="text-zinc-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-zinc-200 border-none outline-none font-mono text-xs uppercase cursor-pointer"
            >
              {districts.map((d) => (
                <option key={d} value={d} className="bg-zinc-900">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg px-4 h-[48px] font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-cyan-400" : ""} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/analytics/export-csv"
            download="district_audit_export.csv"
            className="flex items-center gap-2 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600/20 rounded-lg px-4 h-[48px] font-medium text-sm transition-all active:scale-[0.98] no-underline"
          >
            <FileDown size={16} /> Export CSV
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm border-t-4 border-t-cyan-500">
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Total Audits Count</span>
          <strong className="block text-3xl font-mono text-zinc-100 mb-1">{analytics?.total_inspections ?? 0}</strong>
          <small className="block text-xs text-zinc-400">Pre-seeded & live field records</small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm border-t-4 border-t-emerald-500">
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Compliance Rate %</span>
          <strong className="block text-3xl font-mono text-emerald-400 mb-1">
            {analytics?.compliance_rate ?? 0}%
          </strong>
          <small className="block text-xs text-zinc-400">
            {analytics?.compliant_inspections ?? 0} passed / {analytics?.failed_inspections ?? 0} non-compliant
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm border-t-4 border-t-amber-500">
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Active District Coverage Count</span>
          <strong className="block text-3xl font-mono text-zinc-100 mb-1">{Object.keys(regions).length}</strong>
          <small className="block text-xs text-zinc-400 truncate" title="Delhi, Mumbai, Bengaluru, Kolkata, Chennai">
            Delhi, Mumbai, Bengaluru, Kolkata...
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-sm border-t-4 border-t-rose-500">
          <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Total Estimated Compounding Fines</span>
          <strong className="block text-3xl font-mono text-rose-400 mb-1">
             ₹{((analytics?.failed_inspections ?? 0) * 15000).toLocaleString('en-IN')}
          </strong>
          <small className="block text-xs text-zinc-400">Est. base ₹15K per violation</small>
        </div>
      </div>

      {/* Heatmap & Infraction Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <MapPin size={16} className="text-cyan-400" /> Regional Enforcement Heatmap
            </span>
            <span className="font-mono text-[11px] text-zinc-500 uppercase">Active Audit Hubs</span>
          </div>

          <div className="flex flex-col gap-4 mt-2 overflow-y-auto max-h-[250px] pr-2">
            {Object.entries(regions)
              .filter(
                ([name]) =>
                  selectedDistrict === "All" || name === selectedDistrict,
              )
              .map(([name, count]) => (
                <div className="flex flex-col gap-1.5" key={name}>
                  <div className="flex justify-between items-center text-sm">
                    <b className="text-zinc-200">{name}</b>
                    <span className="text-zinc-400 text-xs">{count} Inspections</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (count / (analytics?.total_inspections || 1)) * 100 * 2.5)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <BarChart3 size={16} className="text-rose-400" /> Statutory Infraction Frequency
            </span>
            <span className="font-mono text-[11px] text-zinc-500 uppercase">By Rule Code</span>
          </div>

          <div className="flex flex-col gap-4 mt-2 overflow-y-auto max-h-[250px] pr-2">
            {/* SVG/Custom Bar Chart replacement */}
            {Object.entries(infractions).map(([rule, count]) => {
                const percentage = (count / maxInfraction) * 100;
                return (
              <div className="flex flex-col gap-1.5" key={rule}>
                <div className="flex justify-between items-center text-sm">
                  <strong className="text-zinc-200">{rule}</strong>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-mono">{count} Violations</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            )})}
            {Object.keys(infractions).length === 0 && (
                <div className="text-zinc-500 text-sm text-center py-4">No infractions recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Inspection Docket */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-200">Recent Inspections</span>
          <span className="font-mono text-[11px] text-zinc-500 uppercase">Section 36 Ready</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="pb-3 px-4 font-medium">Dossier ID</th>
                <th className="pb-3 px-4 font-medium">Target SKU / File</th>
                <th className="pb-3 px-4 font-medium">Region & GPS</th>
                <th className="pb-3 px-4 font-medium">Trust Score</th>
                <th className="pb-3 px-4 font-medium">Status</th>
                <th className="pb-3 px-4 font-medium">Violations</th>
                <th className="pb-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {inspections.map((row) => (
                <tr key={row.inspection_id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-4 px-4">
                    <code className="text-cyan-400 font-mono text-xs">LM-{String(row.inspection_id).padStart(6, "0")}</code>
                  </td>
                  <td className="py-4 px-4 font-medium text-zinc-200">
                    {row.source_filename}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-zinc-300">{row.region}</div>
                    <small className="text-zinc-500 font-mono text-[10px]">
                      {row.gps_location || "28.6139° N, 77.2090° E"}
                    </small>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-mono text-xs border border-zinc-700">
                        {row.trust_score ?? 100}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        row.overall_status === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {row.overall_status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-zinc-400 text-xs">
                    {row.violation_count} Flags
                  </td>
                  <td className="py-4 px-4">
                    <a
                      href={getNoticeDownloadUrl(row.inspection_id)}
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors no-underline min-h-[32px]"
                      download
                    >
                      <FileDown size={14} /> Section 36 PDF
                    </a>
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && !loading && (
                 <tr>
                    <td colSpan="7" className="py-8 text-center text-zinc-500 text-sm">No recent inspections found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
