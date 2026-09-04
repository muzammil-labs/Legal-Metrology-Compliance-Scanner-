import React from "react";
import { Scale, Beaker, Building2, TerminalSquare, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ activeTab, setActiveTab, demoMode, setDemoMode, role, setRole, onGoHome }) {
  const [showDemoMenu, setShowDemoMenu] = React.useState(false);
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const tabs = [
    { id: "consumer", icon: ShieldCheck, label: "Compliance Scanner" },
    { id: "officer", icon: Scale, label: "Officer Dashboard" },
    { id: "seller", icon: Building2, label: "B2B Pre-Audit" },
    { id: "developer", icon: TerminalSquare, label: "Developers" }
  ];

  return (
    <nav className="w-full flex flex-col md:flex-row items-center justify-between py-4 mb-6 border-b border-ink/10 gap-4">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onGoHome}>
        <svg viewBox="0 0 60 60" fill="none" className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform">
          <circle cx="30" cy="30" r="27" stroke="#1E2148" strokeWidth="1.4" strokeDasharray="1.5 4.2"/>
          <circle cx="30" cy="30" r="19" fill="#1E2148"/>
          <g stroke="#E8A33D" strokeWidth="1.6">
            <line x1="30" y1="15" x2="30" y2="21"/>
            <line x1="30" y1="39" x2="30" y2="45"/>
            <line x1="15" y1="30" x2="21" y2="30"/>
            <line x1="39" y1="30" x2="45" y2="30"/>
            <line x1="19.8" y1="19.8" x2="24" y2="24"/>
            <line x1="36" y1="36" x2="40.2" y2="40.2"/>
            <line x1="19.8" y1="40.2" x2="24" y2="36"/>
            <line x1="36" y1="24" x2="40.2" y2="19.8"/>
          </g>
          <circle cx="30" cy="30" r="4.5" fill="#F7F3EA"/>
        </svg>
        <div>
          <h1 className="text-xl font-bold font-serif text-ink tracking-tight leading-none group-hover:text-turmeric-deep transition-colors">PakkaLabel India</h1>
        </div>
      </div>

      <div className="flex bg-seal-cream border border-ink/10 p-1.5 rounded-xl shadow-sm overflow-x-auto w-full md:w-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 min-h-[48px] rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id ? "bg-ink text-paper shadow-md" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}>
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end relative">
        <div className="relative">
          <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="flex items-center gap-2 bg-seal-cream border border-ink/10 px-4 py-2 min-h-[48px] rounded-xl text-sm font-bold text-ink shadow-sm hover:bg-paper capitalize">
            {role.replace('_', ' ')} <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {showRoleMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-14 right-0 w-48 bg-seal-cream border border-ink/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {['consumer', 'field_inspector', 'district_magistrate', 'central_admin'].map(r => (
                  <button key={r} onClick={() => { setRole(r); setShowRoleMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-ink hover:bg-paper border-b border-ink/5 capitalize">
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button onClick={() => setShowDemoMenu(!showDemoMenu)} className="flex items-center gap-2 bg-seal-cream border border-ink/10 px-4 py-2 min-h-[48px] rounded-xl text-sm font-bold text-ink shadow-sm hover:bg-paper">
            <Beaker size={16} className="text-turmeric-deep" /> Demo Fixtures <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {showDemoMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-14 right-0 w-64 bg-seal-cream border border-ink/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => { setDemoMode(null); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-ink hover:bg-paper border-b border-ink/5">Live Camera Mode</button>
                <button onClick={() => { setDemoMode("control_pass"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-sage hover:bg-sage/10 border-b border-ink/5">Product 1 - Compliant</button>
                <button onClick={() => { setDemoMode("control_fail_tax"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-terracotta hover:bg-terracotta/10 border-b border-ink/5">Product 2 - Tax Fail</button>
                <button onClick={() => { setDemoMode("control_fail_unit"); setShowDemoMenu(false); }} className="w-full text-left px-4 py-3 min-h-[48px] text-sm font-bold text-terracotta hover:bg-terracotta/10">Product 3 - Unit Fail</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
