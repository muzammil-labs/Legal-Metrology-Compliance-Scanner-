import React from "react";
import {
  Code, ShieldAlert, Store, Camera, CheckCircle2, AlertTriangle, User, Landmark,
} from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, demoMode, setDemoMode, role, setRole }) {
  const fixtureOptions = [
    { key: null, label: "Live Camera", icon: <Camera size={14} /> },
    { key: "control_pass", label: "Product 1 - Pass", icon: <CheckCircle2 size={14} /> },
    { key: "control_fail_tax", label: "Product 2 - Tax Fail", icon: <AlertTriangle size={14} /> },
    { key: "control_fail_unit", label: "Product 3 - USP Fail", icon: <AlertTriangle size={14} /> },
  ];

  const tabs = [
    { key: "consumer", label: "Scanner", icon: <Camera size={14} /> },
    { key: "officer", label: "Dashboard", icon: <ShieldAlert size={14} /> },
    { key: "seller", label: "Batch Audit", icon: <Store size={14} /> },
    { key: "developer", label: "Developers", icon: <Code size={14} /> },
  ];

  return (
    <header className="sticky top-2 z-50 mx-2 sm:mx-auto max-w-7xl rounded-2xl bg-white/95 backdrop-blur-lg border border-slate-200/80 px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row items-center justify-between gap-3">
      
      {/* Brand */}
      <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100 relative">
            <Landmark size={18} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <strong className="text-slate-900 font-bold text-[13px]">PakkaLabel India</strong>
            <span className="text-slate-500 font-medium text-[9px] uppercase tracking-widest mt-0.5">Dept. of Consumer Affairs</span>
          </div>
        </div>
        <div className="lg:hidden flex items-center bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 gap-1.5 min-h-[36px]">
          <User size={12} className="text-blue-600 shrink-0" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-transparent outline-none border-none cursor-pointer text-xs">
            <option value="FIELD_INSPECTOR">Inspector</option>
            <option value="DISTRICT_MAGISTRATE">Magistrate</option>
            <option value="CENTRAL_ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-1 border border-slate-200/60 rounded-xl overflow-x-auto no-scrollbar w-full lg:w-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
              activeTab === t.key ? "bg-white text-blue-600 shadow-sm border border-slate-200/80 font-semibold" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Fixture Segment + Desktop Role */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
        <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 gap-1.5 min-h-[36px]">
          <User size={13} className="text-blue-600 shrink-0" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-transparent outline-none border-none cursor-pointer text-xs">
            <option value="FIELD_INSPECTOR">Inspector</option>
            <option value="DISTRICT_MAGISTRATE">Magistrate</option>
            <option value="CENTRAL_ADMIN">Admin</option>
          </select>
        </div>
        <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 flex items-center overflow-x-auto no-scrollbar w-full lg:w-auto">
          {fixtureOptions.map((opt) => {
            const isActive = (opt.key === null && demoMode === null) || opt.key === demoMode;
            return (
              <button key={opt.label} onClick={() => setDemoMode(opt.key)} title={opt.label}
                className={`flex items-center gap-1 px-2.5 py-2 text-[10px] uppercase tracking-wider rounded-lg whitespace-nowrap shrink-0 transition-all min-h-[36px] ${
                  isActive ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-500 font-semibold hover:bg-white/50 hover:text-slate-700 active:scale-95"
                }`}>
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.label.split("-")[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
