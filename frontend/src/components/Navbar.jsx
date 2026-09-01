import React from "react";
import {
  Code,
  ShieldAlert,
  Store,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Landmark
} from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  demoMode,
  setDemoMode,
  role,
  setRole,
}) {
  const fixtureOptions = [
    { key: null, label: "Live", shortLabel: "Live Camera", icon: <Camera size={14} /> },
    { key: "control_pass", label: "P1 Pass", shortLabel: "Product 1 · Pass", icon: <CheckCircle2 size={14} /> },
    { key: "control_fail_tax", label: "P2 Tax Fail", shortLabel: "Product 2 · Tax Fail", icon: <AlertTriangle size={14} /> },
    { key: "control_fail_unit", label: "P3 USP Fail", shortLabel: "Product 3 · USP Fail", icon: <AlertTriangle size={14} /> },
  ];

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-3 sm:mx-auto rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-3 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 transition-all duration-300">
      
      {/* Branding & Live Indicator */}
      <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm relative">
            <Landmark size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full animate-ping bg-emerald-500 opacity-75"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 absolute"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <strong className="text-slate-900 font-bold text-sm leading-tight">DOCA Legal Metrology</strong>
            <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Compliance Scanner</span>
          </div>
        </div>
        
        {/* Mobile-only role switcher */}
        <div className="lg:hidden flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 gap-1.5 shadow-sm">
          <User size={12} className="text-blue-600" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent outline-none border-none cursor-pointer pr-1"
          >
            <option value="FIELD_INSPECTOR">Inspector</option>
            <option value="DISTRICT_MAGISTRATE">Magistrate</option>
            <option value="CENTRAL_ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl overflow-x-auto no-scrollbar w-full lg:w-auto shadow-inner">
        <button
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === "consumer" ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          onClick={() => setActiveTab("consumer")}
        >
          <Camera size={14} /> Consumer Scanner
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === "officer" ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          onClick={() => setActiveTab("officer")}
        >
          <ShieldAlert size={14} /> Officer Dashboard
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === "seller" ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          onClick={() => setActiveTab("seller")}
        >
          <Store size={14} /> Seller Batch
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${activeTab === "developer" ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
          onClick={() => setActiveTab("developer")}
        >
          <Code size={14} /> Developers
        </button>
      </div>

      {/* Segmented Fixture & Desktop Role */}
      <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end overflow-hidden">
        
        {/* Desktop Role Switcher */}
        <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 gap-1.5 shadow-sm hover:shadow-md transition-shadow">
          <User size={14} className="text-blue-600" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent outline-none border-none cursor-pointer"
          >
            <option value="FIELD_INSPECTOR">Inspector</option>
            <option value="DISTRICT_MAGISTRATE">Magistrate</option>
            <option value="CENTRAL_ADMIN">Admin</option>
          </select>
        </div>

        {/* Tactile Segmented Demo Fixture Control */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center overflow-x-auto no-scrollbar w-full lg:w-auto shadow-inner">
          {fixtureOptions.map((opt) => {
            const isActive = (opt.key === null && demoMode === null) || opt.key === demoMode;
            return (
              <button
                key={opt.label}
                onClick={() => setDemoMode(opt.key)}
                title={opt.shortLabel}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wide rounded-lg whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm font-bold scale-100" 
                    : "text-slate-500 font-semibold hover:bg-slate-200/50 hover:text-slate-700 active:scale-95"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
