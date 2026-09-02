import React from "react";
import { Scale, Beaker, Building2, TerminalSquare, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ activeTab, setActiveTab, demoMode, setDemoMode, role, setRole }) {
  const [showDemoMenu, setShowDemoMenu] = React.useState(false);

  const tabs = [
    { id: "consumer", icon: ShieldCheck, label: "Compliance Scanner" },
    { id: "officer", icon: Scale, label: "Officer Dashboard" },
    { id: "seller", icon: Building2, label: "B2B Pre-Audit" },
    { id: "developer", icon: TerminalSquare, label: "Developers" }
  ];

  return (
    <nav className="w-full flex flex-col md:flex-row items-center justify-between py-4 mb-6 border-b border-slate-200/80 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl shadow-sm text-white">
          <Scale size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">PakkaLabel</h1>
          <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Enterprise</span>
        </div>
      </div>

      <div className="flex bg-white border border-slate-200/80 p-1.5 rounded-xl shadow-sm overflow-x-auto w-full md:w-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 min-h-[48px] rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}>
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end relative">
        <button onClick={() => setShowDemoMenu(!showDemoMenu)} className="flex items-center gap-2 bg-white border border-slate-200/80 px-4 py-2 min-h-[48px] rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
          <Beaker size={16} className="text-blue-600" /> Demo Fixtures <ChevronDown size={14} />
        </button>
        <AnimatePresence>
          {showDemoMenu && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute top-14 right-0 w-64 bg-white border border-slate-200/80 rounded-xl shadow-xl z-50 overflow-hidden">
              <button onClick={() => { setDemoMode(null); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100">Live Camera Mode</button>
              <button onClick={() => { setDemoMode("control_pass"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-emerald-700 hover:bg-emerald-50 border-b border-slate-100">Product 1 - Compliant</button>
              <button onClick={() => { setDemoMode("control_fail_tax"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-rose-700 hover:bg-rose-50 border-b border-slate-100">Product 2 - Tax Fail</button>
              <button onClick={() => { setDemoMode("control_fail_unit"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-rose-700 hover:bg-rose-50">Product 3 - Unit Fail</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
