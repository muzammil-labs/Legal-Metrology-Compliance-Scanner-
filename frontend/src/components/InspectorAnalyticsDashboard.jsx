import React, { useState, useEffect } from "react";
import { fetchAnalyticsSummary } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Download, FileText, Activity, AlertOctagon, TrendingUp, ShieldAlert, Target } from "lucide-react";

export default function InspectorAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsSummary()
      .then((result) => { setData(result); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-blue-600 animate-pulse">
      <Activity size={28} className="mb-3" />
      <span className="text-sm font-semibold text-slate-500">Loading dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="theme-bright-card p-6 border-l-4 border-l-rose-500">
      <AlertOctagon size={22} className="text-rose-500 mb-2" />
      <h3 className="font-bold text-slate-900">Dashboard Unavailable</h3>
      <p className="text-sm text-slate-600 mt-1">Unable to connect to the analytics service. Please try again.</p>
    </div>
  );

  const stats = {
    total_scans: data?.total_inspections || 0,
    compliance_rate: data?.compliance_rate || 0,
    active_districts: Object.keys(data?.by_region || {}).length,
    total_fines: (data?.failed_inspections || 0) * 25000,
  };

  const infractions = data?.by_rule_infractions || {};
  const chartData = Object.keys(infractions).map((rule) => ({ name: rule, count: infractions[rule] })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Macro-compliance overview across active jurisdictions.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/v1/analytics/export/pdf" className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm active:scale-95 min-h-[40px]">
            <FileText size={14} /> PDF
          </a>
          <a href="/api/v1/analytics/export/excel" className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95 min-h-[40px]">
            <Download size={14} /> CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="theme-bright-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3 relative z-10">Total Audits</span>
          <strong className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter relative z-10">{stats.total_scans.toLocaleString()}</strong>
        </div>
        <div className="theme-bright-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3 relative z-10">Compliance</span>
          <div className="relative z-10 flex items-baseline gap-0.5">
            <strong className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tighter">{stats.compliance_rate.toFixed(1)}</strong>
            <span className="text-lg font-bold text-emerald-400">%</span>
          </div>
        </div>
        <div className="theme-bright-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3 relative z-10">Fine Exposure</span>
          <strong className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight relative z-10">₹{stats.total_fines.toLocaleString()}</strong>
        </div>
        <div className="theme-bright-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3 relative z-10">Districts</span>
          <strong className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter relative z-10">{stats.active_districts}</strong>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="theme-bright-card p-5 sm:p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <AlertOctagon size={16} className="text-blue-500" /> Infraction Frequency by Rule
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", fontSize: "12px", fontWeight: 600 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((_, i) => (<Cell key={i} fill={i === 0 ? "#f43f5e" : i === 1 ? "#f59e0b" : "#3b82f6"} />))}
                  <LabelList dataKey="count" position="top" fill="#475569" fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
