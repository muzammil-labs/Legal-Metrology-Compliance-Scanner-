import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileDown,
  MapPin,
  BarChart3,
  RefreshCw,
  ListFilter,
  CheckCircle2,
  Activity,
  ShieldCheck
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
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");

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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4 bg-slate-950">
        <RefreshCw className="animate-spin text-cyan-500" size={36} />
        <p className="font-mono text-sm tracking-wide">Loading Enforcement Analytics & Regional Docket...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-8 bg-slate-950">
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

  // Custom required districts
  const requiredDistricts = ["Hyderabad Central", "Secunderabad", "Cyberabad"];
  const otherDistricts = Object.keys(regions).filter(d => !requiredDistricts.includes(d));
  const districts = ["All Districts", ...requiredDistricts, ...otherDistricts];

  const maxInfraction = Math.max(...Object.values(infractions), 1);
  const compRate = analytics?.compliance_rate ?? 0;

  return (
    <section className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 text-slate-100 bg-slate-950">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold m-0 tracking-tight text-white mb-2 flex items-center gap-3">
             Enforcement Analytics
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
             </div>
          </h2>
          <p className="font-mono text-sm text-slate-400 m-0 uppercase tracking-widest">All India Retail Zones — Statutory Audit Trail</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500 transition-all h-[48px]">
            <ListFilter size={16} className="text-slate-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none font-mono text-sm cursor-pointer w-full pr-4 appearance-none"
            >
              {districts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-100">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 h-[48px] font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-cyan-400" : ""} />
            <span>Refresh Data</span>
          </button>

          <a
            href="/api/analytics/export-csv"
            download="district_audit_export.csv"
            className="flex items-center gap-2 bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 rounded-xl px-4 py-2 h-[48px] font-medium text-sm transition-all active:scale-[0.98] no-underline shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <FileDown size={18} /> Export CSV
          </a>
        </div>
      </div>

      {/* 4-Card KPI Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-t-4 border-t-cyan-500">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Activity size={14} className="text-cyan-500"/> Total Inspections</span>
            <strong className="block text-4xl font-mono text-slate-100 mb-2 tracking-tight">{analytics?.total_inspections ?? 0}</strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium mt-4">Pre-seeded & live field records</small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-t-4 border-t-emerald-500">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><ShieldCheck size={14} className={compRate >= 70 ? "text-emerald-500" : "text-rose-500"}/> Compliance Rate</span>
            <div className="flex items-end gap-3 mb-2">
                <strong className={`block text-4xl font-mono tracking-tight ${compRate >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {compRate}%
                </strong>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full mb-1 ${compRate >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {compRate >= 70 ? 'Healthy' : 'Critical'}
                </span>
            </div>
          </div>
          <small className="block text-xs text-slate-400 font-medium mt-4">
            {analytics?.compliant_inspections ?? 0} passed / {analytics?.failed_inspections ?? 0} non-compliant
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-t-4 border-t-amber-500">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin size={14} className="text-amber-500"/> Active Districts</span>
            <strong className="block text-4xl font-mono text-slate-100 mb-2 tracking-tight">{Object.keys(regions).length}</strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium truncate mt-4" title="Delhi, Mumbai, Bengaluru, Kolkata, Chennai">
            Delhi, Mumbai, Bengaluru, Kolkata...
          </small>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between border-t-4 border-t-rose-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangle size={14} className="text-rose-500"/> Est. Compounding Fines</span>
            <strong className="block text-4xl font-mono text-rose-400 mb-2 tracking-tight">
               ₹{((analytics?.failed_inspections ?? 0) * 15000).toLocaleString('en-IN')}
            </strong>
          </div>
          <small className="block text-xs text-slate-400 font-medium mt-4 z-10">Est. base ₹15K per violation</small>
        </div>
      </div>

      {/* Visual Charts & Risk Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Statutory Infraction Frequency */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <span className="flex items-center gap-2 text-base font-bold text-slate-200">
              <BarChart3 size={18} className="text-rose-500" /> Statutory Infraction Frequency
            </span>
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-slate-800">Rule 6(1) & 6(11)</span>
          </div>

          <div className="flex flex-col gap-5 mt-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {Object.entries(infractions).map(([rule, count], idx) => {
                const percentage = (count / maxInfraction) * 100;
                // Use themed colors for bars: Cyan (#06b6d4) & Rose (#f4395e)
                const isRose = idx % 2 === 0;
                const barColorClass = isRose ? "bg-rose-500" : "bg-cyan-500";
                const shadowColorClass = isRose ? "shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "shadow-[0_0_10px_rgba(6,182,212,0.5)]";

                return (
              <div className="flex flex-col gap-2.5" key={rule}>
                <div className="flex justify-between items-center text-sm">
                  <strong className="text-slate-200 font-semibold">{rule}</strong>
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold shadow-sm">{count} Violations</span>
                </div>
                {/* Visual Bar Meter */}
                <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 relative">
                  <div
                    className={`absolute left-0 top-0 h-full ${barColorClass} rounded-full transition-all duration-700 ease-out ${shadowColorClass}`}
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

        {/* Right Panel: Regional Heatmap & Repeat Offenders */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <span className="flex items-center gap-2 text-base font-bold text-slate-200">
              <MapPin size={18} className="text-cyan-500" /> Regional Heatmap & Repeat Offenders
            </span>
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-slate-800">High-Risk Zones</span>
          </div>

          <div className="flex flex-col overflow-x-auto rounded-xl border border-slate-800/50 max-h-[350px]">
            <table className="w-full text-left text-sm border-collapse min-w-full">
              <thead className="bg-slate-950/80 sticky top-0 z-10">
                <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800/80">
                  <th className="py-3.5 px-4 font-semibold">Jurisdiction / Zone</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Audit Volume</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
              {Object.entries(regions)
                .filter(
                  ([name]) =>
                    selectedDistrict === "All Districts" || name === selectedDistrict,
                )
                .sort((a,b) => b[1] - a[1])
                .map(([name, count], index) => {
                  const isHighRisk = index === 0;
                  const riskLevel = isHighRisk ? 'High' : 'Elevated';
                  const riskBadgeClass = isHighRisk
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]';

                  return (
                    <tr key={name} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <b className="text-slate-200 font-semibold block">{name}</b>
                        <small className="text-slate-500 font-mono text-[10px]">Repeat Offenders detected</small>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-slate-300 font-mono text-xs bg-slate-800 px-2 py-1 rounded">{count}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${riskBadgeClass}`}>
                          {isHighRisk && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>}
                          {riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {Object.keys(regions).length === 0 && (
                   <tr>
                      <td colSpan="3" className="py-12 text-center text-slate-500 text-sm font-mono border-dashed border-t border-slate-800">No regional data available.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </section>
  );
}
