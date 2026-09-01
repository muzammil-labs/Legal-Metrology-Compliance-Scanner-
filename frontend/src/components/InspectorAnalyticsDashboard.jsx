import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Download, FileText, Activity, AlertOctagon, TrendingUp, ShieldAlert, Target } from 'lucide-react';

export default function InspectorAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-blue-600 animate-pulse">
      <Activity size={32} className="mb-4" />
      <span className="text-sm font-bold tracking-widest uppercase text-slate-500">Aggregating Ledger Telemetry...</span>
    </div>
  );
  
  if (error) return (
    <div className="theme-bright-card p-6 border-l-4 border-l-rose-500 text-rose-600">
      <AlertOctagon size={24} className="mb-2" />
      <h3 className="font-bold">Telemetry Sync Failure</h3>
      <p className="text-sm">{error}</p>
    </div>
  );

  const stats = data?.overview || { total_scans: 0, compliance_rate: 0, active_districts: 0, total_fines: 0 };
  const infractions = data?.infractions_by_rule || {};
  
  // Format data for Recharts
  const chartData = Object.keys(infractions).map(rule => ({
    name: rule.replace('RULE_', '').replace(/_/g, ' '),
    count: infractions[rule],
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Ledger</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Real-time macro-compliance overview across active jurisdictions.</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/v1/analytics/export/pdf" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm active:scale-95">
            <FileText size={16} /> Export PDF Report
          </a>
          <a href="/api/v1/analytics/export/excel" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
            <Download size={16} /> Export CSV Ledger
          </a>
        </div>
      </div>

      {/* Bento Grid KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="theme-bright-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-100 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Audits</span>
            <Target size={16} className="text-blue-500" />
          </div>
          <strong className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">{stats.total_scans.toLocaleString()}</strong>
        </div>

        <div className="theme-bright-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-100 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance Rate</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="relative z-10 flex items-baseline gap-1">
            <strong className="text-4xl font-black text-emerald-600 tracking-tighter">{stats.compliance_rate.toFixed(1)}</strong>
            <span className="text-xl font-bold text-emerald-400">%</span>
          </div>
        </div>

        <div className="theme-bright-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-100 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Est. Fine Exposure</span>
            <TrendingUp size={16} className="text-rose-500" />
          </div>
          <div className="relative z-10 flex flex-col">
            <strong className="text-2xl font-black text-rose-600 tracking-tight">₹ {stats.total_fines.toLocaleString()}</strong>
            <span className="text-xs font-semibold text-rose-400/80 mt-1">Pending compounding</span>
          </div>
        </div>

        <div className="theme-bright-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-100 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Districts</span>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <strong className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">{stats.active_districts}</strong>
        </div>

      </div>

      {/* Charting Section */}
      <div className="theme-bright-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          <AlertOctagon size={18} className="text-blue-500" />
          Statutory Infraction Frequency (By Rule)
        </h3>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: 'bold', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#3b82f6'} />
                ))}
                <LabelList dataKey="count" position="top" fill="#475569" fontSize={11} fontWeight={700} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
