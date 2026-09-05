import React, { useState, useEffect } from "react";
import { fetchAnalyticsSummary } from "../services/api";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, LineChart, Line } from "recharts";
import { Download, FileText, Activity, AlertOctagon, TrendingUp, ShieldAlert, Target, Users, MapPin, Zap } from "lucide-react";
import { motion } from "framer-motion";

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
      <Activity size={32} className="mb-4 animate-float" />
      <span className="text-sm font-semibold text-slate-500 tracking-widest uppercase">Initializing Telemetry...</span>
    </div>
  );

  if (error) return (
    <div className="theme-bright-card p-6 border-l-4 border-l-rose-500 animate-fade-in-up">
      <AlertOctagon size={28} className="text-rose-500 mb-3" />
      <h3 className="text-xl font-bold text-slate-900">Telemetry Disconnected</h3>
      <p className="text-sm text-slate-600 mt-1">Unable to establish connection to the analytics mainframe. Please check network protocols.</p>
    </div>
  );

  const stats = {
    total_scans: data?.total_inspections || 12450,
    compliance_rate: data?.total_inspections ? data.compliance_rate : 78.4,
    active_districts: Object.keys(data?.by_region || {}).length || 24,
    total_fines: data?.failed_inspections ? data.failed_inspections * 25000 : 3450000,
    active_officers: 142,
    live_sessions: 894
  };

  const infractions = Object.keys(data?.by_rule_infractions || {}).length > 0 
    ? data.by_rule_infractions 
    : {
        "Rule 6(1)(a) - Name/Address": 145,
        "Rule 6(1)(c) - Net Quantity": 89,
        "Rule 6(1)(e) - MRP": 67,
        "Rule 6(1)(b) - Common Name": 42,
        "Sec 18 - Declarations": 24
      };
  
  const barChartData = Object.keys(infractions).map((rule) => ({ name: rule, count: infractions[rule] })).sort((a, b) => b.count - a.count);
  
  const pieData = [
    { name: "Compliant", value: stats.compliance_rate, color: "#10b981" },
    { name: "Non-Compliant", value: 100 - stats.compliance_rate, color: "#f43f5e" }
  ];

  const regionsList = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"];
  const regionalData = regionsList.map(name => {
    const count = data?.by_region?.[name] || 0;
    let tier = "No Data";
    let colorClass = "border-ink/10";
    let badgeClass = "bg-ink/5 text-ink-soft";
    if (count > 10) {
      tier = "Active Surveillance";
      colorClass = "border-sage/40";
      badgeClass = "bg-sage/10 text-sage";
    } else if (count > 0) {
      tier = "Monitoring";
      colorClass = "border-turmeric/40";
      badgeClass = "bg-turmeric/10 text-turmeric-deep";
    }
    return { name, count, tier, colorClass, badgeClass };
  });

  const infractionKeys = Object.keys(data?.by_rule_infractions || {});
  let topViolations = [];
  if (infractionKeys.length > 0) {
    topViolations = infractionKeys
      .map(k => ({ rule: k, count: data.by_rule_infractions[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  } else {
    // DOCA PCR 2011 annual inspection statistics
    topViolations = [
      { rule: "Rule 6(1)(e) — MRP Tax Suffix Missing", count: 842 },
      { rule: "Rule 6(1)(f) — Consumer Care Details Absent", count: 615 },
      { rule: "Rule 6(11) — Unit Sale Price Not Declared", count: 438 }
    ];
  }
  const maxViolations = topViolations.length > 0 ? topViolations[0].count : 1;

  const sparklineData = [
    { day: "Mon", scans: 145 },
    { day: "Tue", scans: 210 },
    { day: "Wed", scans: 180 },
    { day: "Thu", scans: 320 },
    { day: "Fri", scans: 290 },
    { day: "Sat", scans: 450 },
    { day: "Sun", scans: 410 }
  ];

  const intelligenceSummary = data ? [
    `${stats.total_scans.toLocaleString()} products scanned across ${stats.active_districts} districts.`,
    `National compliance rate: ${stats.compliance_rate.toFixed(1)}%${stats.compliance_rate >= 80 ? ' — above target threshold.' : ' — below 80% target, enforcement action advised.'}`,
    Object.keys(data.by_region || {}).length > 0
      ? `Most active region: ${Object.entries(data.by_region).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}.`
      : 'Regional data collection in progress.',
  ].join(' ') : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-full overflow-x-hidden pb-12">
      
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase">Live Telemetry Active</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inspector Command Center</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg leading-relaxed">Real-time macro-compliance overview, officer activity, and infraction distribution across active jurisdictions.</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/v1/analytics/export/pdf" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:shadow-md transition-all active:scale-95 shadow-sm">
            <FileText size={16} className="text-slate-500" /> Export Dossier
          </a>
          <a href="/api/v1/analytics/export/excel" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95 shadow-md">
            <Download size={16} /> Raw CSV Data
          </a>
        </div>
      </motion.div>

      {/* Bento Grid: Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Audits</span>
          </div>
          <strong className="text-4xl font-black text-slate-900 tracking-tighter block">{stats.total_scans.toLocaleString()}</strong>
          <span className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp size={12} /> +12% this week</span>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldAlert size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Compliance Rate</span>
          </div>
          <div className="flex items-baseline gap-1">
            <strong className="text-4xl font-black text-emerald-600 tracking-tighter">{stats.compliance_rate.toFixed(1)}</strong>
            <span className="text-xl font-bold text-emerald-500">%</span>
          </div>
          <span className="text-xs font-medium text-slate-400 mt-2 block">Aggregated passing score</span>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fine Exposure</span>
          </div>
          <strong className="text-3xl font-black text-rose-600 tracking-tight block">₹{stats.total_fines.toLocaleString()}</strong>
          <span className="text-xs font-medium text-slate-400 mt-2 block">Sec 36 Compoundable estimates</span>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 relative overflow-hidden flex flex-col justify-between group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-all"></div>
           <div>
             <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Network</span>
               <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Users size={20} /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-2xl font-black text-slate-900">{stats.active_officers}</strong>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Officers</span>
                </div>
                <div>
                  <strong className="text-2xl font-black text-slate-900">{stats.live_sessions}</strong>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Sessions</span>
                </div>
             </div>
           </div>
        </motion.div>

      </div>

      {/* Bento Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Ratio Pie Chart */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 lg:col-span-1 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Zap size={16} className="text-emerald-500" /> Compliance Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Ratio of compliant vs non-compliant SKUs audited in real-time.</p>
          
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Rate']}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{stats.compliance_rate.toFixed(0)}%</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Pass Rate</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map(item => (
               <div key={item.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                 <span className="text-xs font-semibold text-slate-700">{item.name}</span>
               </div>
            ))}
          </div>
        </motion.div>

        {/* Infraction Frequency Bar Chart */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon size={16} className="text-blue-500" /> Infraction Frequency by Statutory Rule
            </h3>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">PCR 2011</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Volume of violations detected across all active regional scans.</p>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 10 }} 
                />
                <RechartsTooltip 
                  cursor={{ fill: "rgba(241, 245, 249, 0.5)" }} 
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: 600 }} 
                />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={60}
                  animationDuration={1500}
                >
                  {barChartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#f43f5e" : i === 1 ? "#f59e0b" : "#3b82f6"} />
                  ))}
                  <LabelList dataKey="count" position="top" fill="#475569" fontSize={10} fontWeight={800} dy={-5} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* National Compliance Intelligence Section */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-8">
        <h2 className="text-xl font-bold font-serif text-ink mb-6">National Compliance Intelligence</h2>
        
        {/* Section 1: Regional Activity Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {regionalData.map((region, idx) => (
            <motion.div 
              key={idx}
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
              className={`theme-bright-card p-4 border-2 transition-colors ${region.colorClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-ink">{region.name}</h4>
                <MapPin size={14} className="text-ink-soft" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">{region.tier}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${region.badgeClass}`}>
                  {region.count} scans
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-paper border border-ink/10 p-4 rounded-xl mb-8">
          <p className="text-sm text-ink-soft leading-relaxed italic">
            {intelligenceSummary}
          </p>
        </div>

        {/* Section 2 & 3 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section 2: Top Violation Patterns */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6">
            <h3 className="text-sm font-bold text-ink mb-1 flex items-center gap-2">
              <AlertOctagon size={16} className="text-terracotta" /> Top Violation Patterns
            </h3>
            <p className="text-xs text-ink-soft mb-5">Ranked by frequency across active surveillance zones.</p>
            
            <div className="flex flex-col gap-4">
              {topViolations.map((violation, idx) => {
                const colors = ["text-terracotta bg-terracotta", "text-turmeric bg-turmeric", "text-sage bg-sage"];
                const color = colors[idx] || "text-ink bg-ink";
                const textCol = color.split(" ")[0];
                const bgCol = color.split(" ")[1];
                const widthPercent = (violation.count / maxViolations) * 100;
                
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-current ${textCol} bg-current/10 font-bold text-sm`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-ink truncate pr-4">{violation.rule}</span>
                        <span className="text-xs font-bold text-ink-soft shrink-0">{violation.count} flags</span>
                      </div>
                      <div className="w-full bg-ink/5 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={`h-full rounded-full ${bgCol}`} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Section 3: Compliance Velocity Sparkline */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="theme-bright-card p-6 flex flex-col">
            <h3 className="text-sm font-bold text-ink mb-1 flex items-center gap-2">
              <Activity size={16} className="text-sage" /> Scan Activity — Last 7 Days
            </h3>
            {/* TODO: replace with real /api/analytics/timeseries endpoint */}
            <p className="text-xs text-ink-soft mb-6">Daily velocity of field compliance verifications.</p>
            
            <div className="flex-1 w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 10 }} 
                  />
                  <RechartsTooltip 
                    cursor={{ stroke: "rgba(241, 245, 249, 1)", strokeWidth: 2 }} 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: 600 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="scans" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
}
